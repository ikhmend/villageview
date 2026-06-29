import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { bookingApi } from "../lib/api";
import { countNights, formatDate } from "../lib/dates";
import "../styles/confirmation.css";

export default function ConfirmationPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingApi.confirmation(bookingId)
      .then(setBooking)
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) {
    return (
      <div className="confirmationPage">
        <ConfirmationHeader />
        <main className="confirmationMain"><section className="missingBooking"><p className="confirmationEyebrow">Village View</p><h1>Уншиж байна...</h1></section></main>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="confirmationPage">
        <ConfirmationHeader />
        <main className="confirmationMain">
          <section className="missingBooking">
            <p className="confirmationEyebrow">Village View</p>
            <h1>Захиалгын мэдээлэл олдсонгүй.</h1>
            <p>Захиалгын маягтыг дахин бөглөх эсвэл нүүр хуудас руу буцна уу.</p>
            <Link to="/#booking">Захиалга хийх <span>→</span></Link>
          </section>
        </main>
      </div>
    );
  }

  const statusLabel = {
    pending: "Баталгаажуулалт хүлээгдэж байна",
    confirmed: "Захиалга баталгаажсан",
    cancelled: "Захиалга цуцлагдсан",
  }[booking.status] || booking.status;

  return (
    <div className="confirmationPage">
      <ConfirmationHeader />
      <main className="confirmationMain">
        <section className="confirmationCard">
          <div className="successIcon" aria-hidden="true">✓</div>
          <p className="confirmationEyebrow">Захиалгын хүсэлт</p>
          <h1>Баярлалаа,<br /><em>{booking.guestName}.</em></h1>
          <p className="confirmationMessage">Захиалгыг хүлээн авлаа. Таны и-мейл рүү захиалгын баталгаажуулалтыг илгээв.</p>
          <div className="bookingStatus"><span>Одоогийн төлөв</span><strong>{statusLabel}</strong></div>
          <dl className="bookingDetails">
            <div><dt>Ирэх өдөр</dt><dd>{formatDate(booking.checkin, { month: "long" })}</dd></div>
            <div><dt>Буцах өдөр</dt><dd>{formatDate(booking.checkout, { month: "long" })}</dd></div>
            <div><dt>Нийт хугацаа</dt><dd>{countNights(booking.checkin, booking.checkout)} шөнө</dd></div>
            <div><dt>Зочдын тоо</dt><dd>{booking.guests} зочин</dd></div>
            <div><dt>Утасны дугаар</dt><dd>{booking.phone || "—"}</dd></div>
            <div><dt>И-мэйл</dt><dd>{booking.email || "—"}</dd></div>
            <div className="referenceDetail"><dt>Захиалгын дугаар</dt><dd>{booking.id}</dd></div>
          </dl>
          <div className="confirmationActions">
            <Link to="/">Нүүр хуудас руу буцах <span>→</span></Link>
            <button type="button" onClick={() => window.print()}>Хэвлэх</button>
          </div>
        </section>
      </main>
    </div>
  );
}

function ConfirmationHeader() {
  return (
    <header className="confirmationHeader">
      <Link className="confirmationBrand" to="/" aria-label="Village View нүүр хуудас"><span className="confirmationBrandMark">V</span><span>Village View</span></Link>
      <Link className="confirmationHomeLink" to="/">Нүүр хуудас <span aria-hidden="true">↗</span></Link>
    </header>
  );
}
