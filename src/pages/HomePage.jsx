import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BookingDatePicker from "../components/BookingDatePicker";
import { bookingApi } from "../lib/api";
import { addDays, toISODate } from "../lib/dates";
import heroImage from "../../images/IMG_2731.jpeg";
import stayImage from "../../images/IMG_9233_Original_Original.jpeg";
import detailImage from "../../images/IMG_1128.jpeg";
import galleryOne from "../../images/IMG_2833.jpeg";
import galleryTwo from "../../images/IMG_0038.jpeg";
import galleryThree from "../../images/IMG_9096_Original.jpeg";
import galleryFour from "../../images/IMG_2842.jpeg";
import galleryFive from "../../images/IMG_2459_Original_Original.jpeg";
import gallerySix from "../../images/IMG_9297_Original.jpeg";

const galleryImages = [
  [galleryOne, "Цаст уулын бэлд байрлах Village View модон байшин"],
  [galleryTwo, "Village View байшингийн модон интерьер, хоолны ширээ"],
  [galleryThree, "Том цонхоор уулс харагдах байшингийн дотор тал"],
  [galleryFour, "Цасан дээрх байшингийн түлхүүр"],
  [galleryFive, "Village View байшингийн дээд давхрын унтлагын хэсэг"],
  [gallerySix, "Village View байшингийн цэлгэр дотор орчин"],
];

function BookingForm() {
  const navigate = useNavigate();
  const [bookedDates, setBookedDates] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadAvailability() {
    setAvailabilityLoading(true);
    const today = new Date();
    const start = toISODate(today);
    const end = addDays(start, 730);
    try {
      const availability = await bookingApi.availability(start, end);
      setBookedDates(availability.bookedDates);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAvailabilityLoading(false);
    }
  }

  useEffect(() => {
    loadAvailability();
  }, []);

  function handleCheckin(value) {
    setCheckin(value);
    setError("");
    if (!checkout || checkout <= value) setCheckout(addDays(value, 1));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    if (!checkin || !checkout) {
      setError("Ирэх болон буцах өдрөө сонгоно уу.");
      return;
    }

    if (checkout <= checkin) {
      setError("Буцах өдөр ирэх өдрөөс хойш байх ёстой.");
      return;
    }

    const unavailable = bookedDates.some((date) => date >= checkin && date < checkout);
    if (unavailable) {
      setCheckin("");
      setCheckout("");
      setError("Календар шинэчлэгдсэн тул өдрөө дахин сонгоно уу.");
      return;
    }

    const bookingPayload = {
      guestName: String(form.get("guestName")).trim(),
      phone: String(form.get("phone")).trim(),
      email: String(form.get("email")).trim(),
      guests: Number(form.get("guests")),
      checkin,
      checkout,
    };

    setSubmitting(true);
    setError("");
    try {
      const booking = await bookingApi.create(bookingPayload);
      navigate(`/confirmation/${booking.id}`);
    } catch (requestError) {
      if (requestError.code === "CONFLICT" || requestError.code === "BOOKING_DATE_CONFLICT") {
        setCheckin("");
        setCheckout("");
        await loadAvailability();
        setError("Календар шинэчлэгдсэн тул өдрөө дахин сонгоно уу.");
      } else {
        setError(requestError.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="bookingForm" onSubmit={handleSubmit}>
      <BookingDatePicker
        bookedDates={bookedDates}
        loading={availabilityLoading}
        checkin={checkin}
        checkout={checkout}
        onCheckin={handleCheckin}
        onCheckout={(value) => { setCheckout(value); setError(""); }}
      />
      <div className="formField">
        <label htmlFor="guests">Зочдын тоо</label>
        <select id="guests" name="guests" defaultValue="2" required>
          <option value="1">1 зочин</option>
          <option value="2">2 зочин</option>
        </select>
      </div>
      <div className="formField">
        <label htmlFor="guestName">Таны нэр</label>
        <input type="text" id="guestName" name="guestName" autoComplete="name" placeholder="Нэрээ оруулна уу" required />
      </div>
      <div className="formField">
        <label htmlFor="phone">Утасны дугаар</label>
        <input type="tel" id="phone" name="phone" autoComplete="tel" placeholder="Жишээ: 9911 2233" required />
      </div>
      <div className="formField">
        <label htmlFor="email">И-мэйл</label>
        <input type="email" id="email" name="email" autoComplete="email" placeholder="name@example.com" required />
      </div>
      <button type="submit" disabled={submitting || availabilityLoading}>{submitting ? "Илгээж байна..." : "Хүсэлт илгээх"} <span aria-hidden="true">→</span></button>
      <p className={`formMessage${error ? " isError" : ""}`} role="alert">{error}</p>
    </form>
  );
}

export default function HomePage() {
  return (
    <div className="sitePage">
      <header className="siteHeader">
        <a className="brand" href="#home" aria-label="Village View нүүр хуудас">
          <span>Village View</span>
        </a>
        <nav className="mainNav" aria-label="Үндсэн цэс">
          <a href="#stay">Байшин</a><a href="#gallery">Зургийн цомог</a>
        </nav>
        <a className="headerCta" href="#booking">Захиалах <span aria-hidden="true">↗</span></a>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="heroContent">
            <p className="eyebrow"><span /> Түнхэл тосгон, Мандал сум, Сэлэнгэ аймаг. Хараа голын дэргэд</p>
            <h1>Тайван орон зай.<br /><em>Мартагдашгүй</em> мөч.</h1>
            <p className="heroCopy">Хараа голын дэргэд, ой модны чимээнд хайртай хүнтэйгээ амарч, өдөр тутмын хэмнэлээс түр холдоорой.</p>
            <div className="heroActions">
              <a className="primaryButton" href="#booking">Амралтаа төлөвлөх <span>→</span></a>
              <a className="textLink" href="#stay">Байшин үзэх <span>↓</span></a>
            </div>
            <div className="heroDetails" aria-label="Байшингийн үндсэн мэдээлэл">
              <div><strong>2</strong><span>Зочин</span></div>
              <div><strong>1</strong><span>Унтлагын өрөө</span></div>
              <div><strong>365</strong><span>Өдөр нээлттэй</span></div>
            </div>
          </div>
          <div className="heroVisual">
            <img src={heroImage} alt="Цаст уулын бэлд байрлах Village View байшингууд" />
            <span className="imageLabel">01 — Байгальтай ойр</span>
          </div>
        </section>

        <section className="booking" id="booking">
          <div className="bookingIntro">
            <p className="sectionKicker">Захиалга</p>
            <h2>Амралтын өдрөө<br /><em>сонгоорой.</em></h2>
          </div>
          <BookingForm />
        </section>

        <section className="stay" id="stay">
          <div className="stayImage mainImage"><img src={stayImage} alt="Village View байшингийн цэлгэр модон интерьер" /></div>
          <div className="stayInfo">
            <p className="eyebrow"><span /> Таны амралтын орон зай</p>
            <h2>Энгийн хэрнээ<br />бүх зүйлтэй.</h2>
            <ul>
              <li><span>01</span> 2 хүн орох боломжтой</li>
              <li><span>02</span> 100% модон доторлогоо</li>
              <li><span>03</span> Эко 00</li>
              <li><span>04</span> Уул мод горхитой ойр</li>
            </ul>
          </div>
          <div className="stayImage detailImage"><img src={detailImage} alt="Модон байшингийн доторх муур" loading="lazy" /></div>
        </section>

        <section className="gallery" id="gallery">
          <div className="galleryHeader">
            <div><p className="sectionKicker">Агшин бүр үнэ цэнтэй</p><h2>Энд таны түүх<br /><em>эхэлнэ.</em></h2></div>
          </div>
          <div className="galleryTrack" tabIndex="0" aria-label="Village View зургийн цомог. Хажуу тийш гүйлгэж үзнэ үү.">
            {galleryImages.map(([src, alt]) => <figure key={src}><img src={src} alt={alt} loading="lazy" /></figure>)}
          </div>
        </section>
      </main>

      <footer className="siteFooter">
        <a className="brand footerBrand" href="#home"><span>Village View</span></a>
        <p>Түнхэл тосгон, Хараа голын дэргэд</p>
        <div className="footerLinks"><a href="#instagram">Instagram</a><a href="#facebook">Facebook</a><a href="mailto:hello@villageview.mn">И-мэйл</a></div>
        <p className="copyright">© 2026 Village View</p>
      </footer>
    </div>
  );
}
