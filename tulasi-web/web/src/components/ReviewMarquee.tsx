// ReviewMarquee – server component.
// Auto-scrolling two-row ticker of Google reviews.
// Names are replaced with anonymous labels per TL feedback.
import { MarqueePause } from "@/components/MarqueePause";

export type Review = {
  quote: string;
  label: string; // anonymous label, e.g. "Patient, Gurgaon"
  rating: number;
};

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 16 16"
          className={`size-3.5 ${i < n ? "fill-amber-400 text-amber-400" : "fill-line text-line"}`}
          aria-hidden="true"
        >
          <path d="M8 1.5l1.8 3.6 4 .6-2.9 2.8.7 4L8 10.4l-3.6 1.9.7-4L2.2 5.7l4-.6L8 1.5z" />
        </svg>
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="review-card">
      <div className="review-top">
        <Stars n={review.rating} />
        {/* Google logo pill */}
        <span className="review-source" aria-label="Google review">
          <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </span>
      </div>
      <blockquote className="review-quote">{review.quote}</blockquote>
      <figcaption className="review-author">{review.label}</figcaption>
    </figure>
  );
}

function ReviewRow({
  reviews,
  direction,
  duration,
}: {
  reviews: Review[];
  direction: "left" | "right";
  duration: number;
}) {
  return (
    <div className="review-row-wrap">
      <MarqueePause className="review-track-outer">
        <div
          className={`review-track review-${direction}`}
          style={{ "--review-dur": `${duration}s` } as React.CSSProperties}
        >
          {reviews.map((r, i) => (
            <ReviewCard key={i} review={r} />
          ))}
          <div aria-hidden="true" className="review-dupe">
            {reviews.map((r, i) => (
              <ReviewCard key={`dup-${i}`} review={r} />
            ))}
          </div>
        </div>
      </MarqueePause>
    </div>
  );
}

const ALL_REVIEWS: Review[] = [
  { rating: 5, label: "Patient family, Gurgaon",        quote: "Staff at Tulasi Healthcare Gurgaon were supportive and polite. Environment felt calm, and the doctors explained things clearly. Overall, the experience was comfortable and reassuring for us." },
  { rating: 5, label: "Local Guide · Gurgaon",          quote: "I had a wonderful experience — all the needs were well taken care of. Staff from junior doctors to nursing were very friendly and empathetic." },
  { rating: 5, label: "Patient family, Delhi-NCR",      quote: "My experience at Tulasi Healthcare has been life changing. The team is caring and truly committed to each patient. Every step of the programme is thoughtfully planned and I always felt encouraged and supported." },
  { rating: 5, label: "Patient family, Gurgaon",        quote: "Excellent services. I found their care to be truly wonderful — all needs were attended to and the environment was very supportive." },
  { rating: 5, label: "Patient, Delhi-NCR",             quote: "I'm extremely happy with the care provided at Tulasi Healthcare. The doctors, therapists, and staff were very understanding and supportive throughout the treatment process. They took the time to listen and explain everything clearly." },
  { rating: 5, label: "Patient, Gurgaon",               quote: "Dr. Gorav Gupta's expert treatment helped me overcome depression and manage mood swings dramatically. My health has improved remarkably thanks to his guidance." },
  { rating: 5, label: "Patient, Delhi-NCR",             quote: "I had a very positive experience at Tulasi Healthcare. The staff is professional, caring, and truly supportive. The facility is clean, well-maintained, and provides a calm environment." },
  { rating: 5, label: "Visitor, Delhi-NCR",             quote: "The facility is clean, modern, and creates a calm, welcoming atmosphere. The staff — from reception to doctors — were polite, professional, and made me feel comfortable." },
  { rating: 5, label: "Patient family, Delhi",          quote: "Tulasi Healthcare is truly exceptional when it comes to mental health and rehabilitation services. The centre offers a wide range of treatments and the staff is highly professional and attentive." },
  { rating: 5, label: "Patient family, Gurgaon",        quote: "Had a good experience at Tulasi Healthcare Gurgaon — staff was polite, doctors explained everything clearly, and the overall process felt smooth, comfortable, and well managed." },
  { rating: 5, label: "Patient, North India",           quote: "Tulasi Healthcare is one of the most trusted mental health centres in Delhi-NCR. The staff is highly professional, caring, and supportive. Highly recommended." },
  { rating: 5, label: "Patient family, Delhi",          quote: "Tulasi Healthcare provides excellent mental health and rehabilitation services. The doctors, psychologists, and support staff are very professional, caring, and attentive to patients' needs." },
  { rating: 5, label: "Patient family, Delhi-NCR",      quote: "Tulasi Healthcare is one of the best private mental health centres in North India. The team is well-trained, professional, and truly supportive — not just to patients but also to their families." },
  { rating: 5, label: "Friend of patient, Delhi",       quote: "My friend was admitted for addiction disorder for 2 months. Now he is sober and leading a meaningful life. Dr. Gorav Gupta's treatment does wonders. I highly recommend Tulasi Healthcare for addiction treatment." },
];

export function ReviewMarquee() {
  const row1 = ALL_REVIEWS.filter((_, i) => i % 2 === 0);
  const row2 = ALL_REVIEWS.filter((_, i) => i % 2 !== 0);

  return (
    <div className="review-marquee-section" aria-label="Patient reviews">
      <ReviewRow reviews={row1} direction="left"  duration={55} />
      <ReviewRow reviews={row2} direction="right" duration={70} />
    </div>
  );
}
