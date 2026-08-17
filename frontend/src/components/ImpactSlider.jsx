import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const SLIDES = [
  {
    key: "home",
    image: "/slider/homeless.png",
    stat: "1.77 Million People",
    description: "were recorded as houseless in Census 2011.",
    tagline: "We're working to give every family a safe, dignified place to call home.",
    source: "https://censusindia.gov.in/nada/index.php/catalog/5047",
    missionKey: "home",
  },
  {
    key: "education",
    image: "/slider/education.png",
    stat: "6.06 Million Children",
    description: "were estimated to be out of school in 2014.",
    tagline: "Every child deserves a classroom — education can rewrite a child's future.",
    source:
      "https://www.unicef.org/innocenti/media/9371/file/UNICEF-Innocenti-Leveraging-Education_Child-Labour-2024-report.pdf",
    missionKey: "education",
  },
  {
    key: "clean_india",
    image: "/slider/clean-india.png",
    stat: "170,339 Tonnes/Day",
    description: "of solid waste is generated in India — 22% remains unaccounted for.",
    tagline: "Clean, healthy communities start with what we choose not to ignore.",
    source: "https://cpcb.gov.in/uploads/MSW/MSW_AnnualReport_2021-22.pdf",
    missionKey: "clean_india",
  },
  {
    key: "food",
    image: "/slider/food.png",
    stat: "10.7%",
    description: "of people in Southern Asia faced chronic undernourishment in 2024.",
    tagline: "A shared meal today can mean hope for tomorrow.",
    source:
      "https://www.fao.org/sustainable-development-goals-data-portal/data/indicators/2.1.1-prevalence-of-undernourishment/en",
    missionKey: "food",
  },
];

export default function ImpactSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (paused) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timerRef.current);
  }, [paused]);

  const slide = SLIDES[index];

  return (
    <section
      className="impact-slider"
      aria-roledescription="carousel"
      aria-label="Why our work matters"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <a className="impact-slide" href={slide.source} target="_blank" rel="noreferrer" key={slide.key}>
        <img className="impact-slide-img" src={slide.image} alt={slide.stat} />
        <div className="impact-slide-overlay">
          <div className="impact-slide-stat">{slide.stat}</div>
          <p className="impact-slide-description">{slide.description}</p>
          <p className="impact-slide-tagline">{slide.tagline}</p>
          <span className="impact-slide-source">Source ↗</span>
        </div>
      </a>

      <Link to={`/mission/${slide.missionKey}`} className="impact-slide-cta btn">
        See how we help →
      </Link>

      <button
        type="button"
        className="impact-slider-arrow prev"
        aria-label="Previous slide"
        onClick={() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
      >
        ‹
      </button>
      <button
        type="button"
        className="impact-slider-arrow next"
        aria-label="Next slide"
        onClick={() => setIndex((i) => (i + 1) % SLIDES.length)}
      >
        ›
      </button>

      <div className="impact-slider-dots">
        {SLIDES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            className={`impact-slider-dot ${i === index ? "active" : ""}`}
            aria-label={`Go to slide ${i + 1}: ${s.stat}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}
