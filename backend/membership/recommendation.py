"""
Role recommendation for a single application — a pure read-only scoring function, never
an auto-assignment. The admin always makes the final call via the assign-role action.
"""

from .models import RegionalNeed


def recommend_roles(application):
    """Returns a list of {role, required, assigned, remaining, score, reasons} dicts,
    ranked by score, for every open need in the application's region."""
    needs = (
        RegionalNeed.objects.filter(region=application.region, is_active=True)
        .select_related("role")
    )
    applicant_skills = {s.name.lower() for s in application.skills.all()}

    results = []
    for need in needs:
        if need.remaining <= 0:
            continue

        score = 0
        reasons = []

        role_name_words = set(need.role.name.lower().split())
        skill_overlap = applicant_skills & role_name_words
        if skill_overlap or any(word in applicant_skills for word in role_name_words):
            score += 3
            reasons.append(f"Applicant's skills match the {need.role.name} role")
        elif applicant_skills:
            # Still credit *some* relevant expertise even without an exact name match —
            # having any listed skill is a weak positive signal over having none.
            score += 1
            reasons.append("Applicant has relevant skills listed")

        if application.years_of_experience >= 2:
            score += 2
            reasons.append(f"{application.years_of_experience} years of experience")
        elif application.years_of_experience >= 1:
            score += 1
            reasons.append("Some prior experience")

        if application.volunteer_experience or application.ngo_experience:
            score += 1
            reasons.append("Prior volunteer/NGO experience")

        if application.hours_per_week:
            score += 1
            reasons.append(f"Available {application.hours_per_week} hours/week")

        if need.remaining > 0:
            score += 1
            reasons.append(f"Region still needs {need.remaining} more {need.role.name}")

        if not reasons:
            reasons.append("Open need in the applicant's region")

        results.append(
            {
                "role_id": str(need.role.id),
                "role_name": need.role.name,
                "required": need.required_count,
                "assigned": need.assigned,
                "remaining": need.remaining,
                "score": score,
                "reasons": reasons,
            }
        )

    results.sort(key=lambda r: r["score"], reverse=True)
    return results
