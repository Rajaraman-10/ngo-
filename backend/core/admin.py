from django.contrib import admin

from .models import (
    Activity,
    Beneficiary,
    ImpactUpdate,
    Inquiry,
    Mission,
    News,
    NewsletterSubscriber,
    Project,
    Story,
)

admin.site.register(Project)
admin.site.register(Beneficiary)
admin.site.register(Mission)
admin.site.register(Activity)
admin.site.register(ImpactUpdate)
admin.site.register(Story)
admin.site.register(News)
admin.site.register(Inquiry)
admin.site.register(NewsletterSubscriber)
