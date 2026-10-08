// ReviewGrid – server component.
// Masonry-style bento grid of Google reviews on a dark navy background.
// No marquee, no scrolling — editorial, premium layout with varying card sizes.
// No patient names — anonymous labels only, per TL feedback.

export type Review = {
  quote: string;
  label: string;
  rating: number;
  size?: "large" | "normal"; // large cards span 2 columns on md+
};

function Stars({ n }: { n: number }) {
  return (
    <span className="rg-stars" role="img" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 16 16" className={`rg-star${i < n ? " rg-star-on" : ""}`} aria-hidden="true">
          <path d="M8 1.5l1.8 3.6 4 .6-2.9 2.8.7 4L8 10.4l-3.6 1.9.7-4L2.2 5.7l4-.6L8 1.5z" />
        </svg>
      ))}
    </span>
  );
}

function ReviewCard({ review, priority }: { review: Review; priority?: boolean }) {
  return (
    <figure className={`rg-card${review.size === "large" ? " rg-card-lg" : ""}`}>
      {/* Decorative quote mark */}
      <span className="rg-quote-mark" aria-hidden="true">"</span>
      <blockquote className="rg-quote">{review.quote}</blockquote>
      <figcaption className="rg-meta">
        <Stars n={review.rating} />
        <span className="rg-author">{review.label}</span>
        {/* Google badge */}
        <span className="rg-badge" aria-label="Google review">
          <svg viewBox="0 0 24 24" className="rg-glogo" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </span>
      </figcaption>
    </figure>
  );
}

export const REVIEWS: Review[] = [
  {
    size: "large",
    rating: 5,
    label: "Patient family, Gurgaon",
    quote: "My experience at Tulasi Healthcare has been life changing. The team is caring and truly committed to each patient. Every step of the programme is thoughtfully planned — I always felt encouraged and supported. I heartedly recommend Tulasi Healthcare.",
  },
  {
    rating: 5,
    label: "Patient, Delhi-NCR",
    quote: "Staff were supportive and polite. The environment felt calm, and the doctors explained things clearly. The experience was comfortable and reassuring.",
  },
  {
    rating: 5,
    label: "Friend of patient, Delhi",
    quote: "My friend was admitted for addiction disorder for 2 months. Now he is sober and leading a meaningful life. Dr. Gorav Gupta's treatment does wonders. I highly recommend Tulasi Healthcare.",
  },
  {
    size: "large",
    rating: 5,
    label: "Patient, Gurgaon",
    quote: "The doctors, therapists, and staff were very understanding and supportive throughout the treatment process. They took the time to listen, explain everything clearly, and make us feel at ease every step of the way.",
  },
  {
    rating: 5,
    label: "Local Guide · Gurgaon",
    quote: "A wonderful experience — all needs were well taken care of. Staff from junior doctors to nursing were very friendly and empathetic.",
  },
  {
    rating: 5,
    label: "Patient family, Delhi",
    quote: "Tulasi Healthcare is truly exceptional when it comes to mental health and rehabilitation services. The staff is highly professional and attentive to every need.",
  },
  {
    rating: 5,
    label: "Patient, North India",
    quote: "One of the most trusted mental health centres in Delhi-NCR. The staff is highly professional, caring, and supportive. Their approach is comprehensive and effective.",
  },
  {
    rating: 5,
    label: "Patient, Gurgaon",
    quote: "Treatment helped me overcome depression and manage mood swings dramatically. My health has improved remarkably. Without this guidance, I would not be in the positive state I enjoy today.",
  },
  {
    rating: 5,
    label: "Patient family, Delhi-NCR",
    quote: "The facility is clean, well-maintained, and provides a calm environment that really helps with recovery. Professional, caring, and truly supportive throughout.",
  },
];

export function ReviewGrid() {
  return (
    <div className="rg-grid">
      {REVIEWS.map((r, i) => (
        <ReviewCard key={i} review={r} />
      ))}
    </div>
  );
}
