import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminUserApi, bookingApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { addDays, countNights, datesOverlap, formatDate, toISODate } from "../lib/dates";
import "../styles/admin.css";

const STATUS_LABELS = {
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  cancelled: "Цуцалсан",
};

function newBooking() {
  const today = toISODate(new Date());
  return {
    id: "",
    guestName: "",
    phone: "",
    email: "",
    guests: 2,
    checkin: today,
    checkout: addDays(today, 1),
    status: "confirmed",
    notes: "",
    createdAt: "",
  };
}

function BookingEditor({ booking, bookings, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(booking);
  const [error, setError] = useState("");

  function update(field, value) {
    setError("");
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleCheckin(value) {
    setDraft((current) => ({
      ...current,
      checkin: value,
      checkout: current.checkout <= value ? addDays(value, 1) : current.checkout,
    }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (draft.checkout <= draft.checkin) {
      setError("Буцах өдөр ирэх өдрөөс хойш байх ёстой.");
      return;
    }
    const conflict = draft.status === "confirmed" && bookings.some(
      (item) => item.id !== draft.id && item.status === "confirmed" &&
        datesOverlap(draft.checkin, draft.checkout, item.checkin, item.checkout),
    );
    if (conflict) {
      setError("Энэ хугацаанд өөр баталгаажсан захиалга байна.");
      return;
    }
    try {
      await onSave(draft);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="adminModal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="editorDialog" role="dialog" aria-modal="true" aria-labelledby="editorTitle">
        <form onSubmit={handleSubmit}>
          <div className="dialogHeader">
            <div><p className="panelKicker">Захиалга</p><h2 id="editorTitle">{draft.id ? "Захиалга засах" : "Шинэ захиалга"}</h2></div>
            <button className="iconButton" type="button" onClick={onClose} aria-label="Хаах">×</button>
          </div>
          <div className="editorGrid">
            <label className="editorField fullWidth"><span>Зочны нэр</span><input value={draft.guestName} onChange={(e) => update("guestName", e.target.value)} required autoFocus /></label>
            <label className="editorField"><span>Ирэх өдөр</span><input type="date" value={draft.checkin} onChange={(e) => handleCheckin(e.target.value)} required /></label>
            <label className="editorField"><span>Буцах өдөр</span><input type="date" min={addDays(draft.checkin, 1)} value={draft.checkout} onChange={(e) => update("checkout", e.target.value)} required /></label>
            <label className="editorField"><span>Зочдын тоо</span><select value={draft.guests} onChange={(e) => update("guests", Number(e.target.value))}><option value="1">1 зочин</option><option value="2">2 зочин</option></select></label>
            <label className="editorField"><span>Төлөв</span><select value={draft.status} onChange={(e) => update("status", e.target.value)}><option value="pending">Хүлээгдэж буй</option><option value="confirmed">Баталгаажсан</option><option value="cancelled">Цуцалсан</option></select></label>
            <label className="editorField"><span>Утас</span><input type="tel" value={draft.phone} onChange={(e) => update("phone", e.target.value)} required /></label>
            <label className="editorField"><span>И-мэйл</span><input type="email" value={draft.email} onChange={(e) => update("email", e.target.value)} /></label>
            <label className="editorField fullWidth"><span>Тэмдэглэл</span><textarea rows="3" value={draft.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Нэмэлт мэдээлэл..." /></label>
          </div>
          <p className="editorError" role="alert">{error}</p>
          <div className="dialogActions">
            {draft.id ? <button className="deleteButton" type="button" onClick={() => onDelete(draft)}>Устгах</button> : <span />}
            <div><button className="secondaryButton" type="button" onClick={onClose}>Болих</button><button className="saveButton" type="submit">Хадгалах</button></div>
          </div>
        </form>
      </section>
    </div>
  );
}

function InviteAdminEditor({ onClose, onInvited, onChanged }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    try {
      await adminUserApi.invite({
        name: String(form.get("name") || "").trim(),
        email: String(form.get("email") || "").trim(),
      });
      await onInvited();
    } catch (requestError) {
      if (requestError.code === "CONFLICT") setError("Энэ и-мэйлтэй админ бүртгэлтэй байна.");
      else if (requestError.code === "INVITATION_EMAIL_FAILED") {
        await onChanged();
        setError("Урилгын и-мэйл илгээж чадсангүй. Цонхыг хаагаад админы жагсаалтаас дахин илгээнэ үү.");
      } else setError("Админ урьж чадсангүй. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="adminModal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="editorDialog compactDialog" role="dialog" aria-modal="true" aria-labelledby="inviteAdminTitle">
        <form onSubmit={handleSubmit}>
          <div className="dialogHeader">
            <div><p className="panelKicker">Админ эрх</p><h2 id="inviteAdminTitle">Шинэ админ урих</h2></div>
            <button className="iconButton" type="button" onClick={onClose} aria-label="Хаах">×</button>
          </div>
          <div className="editorGrid">
            <label className="editorField fullWidth"><span>Нэр</span><input name="name" minLength="2" maxLength="120" required autoFocus /></label>
            <label className="editorField fullWidth"><span>И-мэйл</span><input name="email" type="email" autoComplete="email" maxLength="254" required /></label>
          </div>
          <p className="editorError" role="alert" aria-live="polite">{error}</p>
          <div className="dialogActions inviteActions"><span /><div><button className="secondaryButton" type="button" onClick={onClose}>Болих</button><button className="saveButton" type="submit" disabled={loading}>{loading ? "Илгээж байна..." : "Урилга илгээх"}</button></div></div>
        </form>
      </section>
    </div>
  );
}

function AdminUsersPanel({ admins, currentAdmin, loading, error, onRetry, onInvite, onChanged, notify }) {
  const [busyId, setBusyId] = useState("");

  async function run(admin, action, confirmation, successMessage) {
    if (confirmation && !window.confirm(confirmation)) return;
    setBusyId(admin.id);
    try {
      await action();
      await onChanged();
      notify(successMessage);
    } catch (requestError) {
      if (requestError.code === "FORBIDDEN") notify("Өөрийн админ эрхийг идэвхгүй болгох боломжгүй.");
      else if (requestError.code === "CONFLICT") notify("Сүүлийн идэвхтэй админы эрхийг идэвхгүй болгох боломжгүй.");
      else if (requestError.code === "INVITATION_EMAIL_FAILED") notify("Урилгын и-мэйл илгээж чадсангүй.");
      else notify("Үйлдлийг гүйцэтгэж чадсангүй.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="adminPanel adminUsersPanel">
      <div className="panelHeader">
        <div><p className="panelKicker">Хандалтын удирдлага</p><h2>Админууд</h2></div>
        <button className="editButton" type="button" onClick={onInvite}>Админ урих ＋</button>
      </div>
      <div className="tableWrap">
        {error ? <div className="emptyState"><strong>Админы жагсаалт уншигдсангүй</strong><p>{error}</p><button className="editButton" type="button" onClick={onRetry}>Дахин оролдох</button></div> : loading ? <div className="emptyState"><strong>Уншиж байна...</strong></div> : (
          <table><thead><tr><th>Админ</th><th>Төлөв</th><th>Сүүлд нэвтэрсэн</th><th /></tr></thead>
            <tbody>{admins.map((item) => {
              const pending = !item.invitationAcceptedAt;
              const status = pending ? "Урилга хүлээгдэж буй" : item.isActive ? "Идэвхтэй" : "Идэвхгүй";
              const statusClass = pending ? "pending" : item.isActive ? "" : "cancelled";
              const busy = busyId === item.id;
              return (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong><small>{item.email}{item.id === currentAdmin?.id ? " · Та" : ""}</small></td>
                  <td><span className={`statusBadge ${statusClass}`}>{status}</span></td>
                  <td>{item.lastLoginAt ? new Intl.DateTimeFormat("mn-MN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.lastLoginAt)) : "—"}</td>
                  <td><div className="adminUserActions">
                    {pending ? <><button className="editButton" type="button" disabled={busy} onClick={() => run(item, () => adminUserApi.resendInvitation(item.id), "Урилгыг дахин илгээх үү?", "Урилгыг дахин илгээлээ.")}>Дахин илгээх</button><button className="deleteButton" type="button" disabled={busy} onClick={() => run(item, () => adminUserApi.cancelInvitation(item.id), "Энэ урилгыг цуцлах уу?", "Урилгыг цуцаллаа.")}>Цуцлах</button></> : item.id !== currentAdmin?.id && <button className={item.isActive ? "deleteButton" : "editButton"} type="button" disabled={busy} onClick={() => run(item, () => adminUserApi.setActive(item.id, !item.isActive), item.isActive ? `${item.name}-ийн эрхийг идэвхгүй болгох уу?` : "", item.isActive ? "Админ эрхийг идэвхгүй болголоо." : "Админ эрхийг идэвхжүүллээ.")}>{item.isActive ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}</button>}
                  </div></td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function Calendar({ visibleMonth, bookings, onSelect }) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const today = toISODate(new Date());

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const isoDate = toISODate(date);
    return {
      date,
      isoDate,
      dayBookings: bookings.filter((booking) =>
        booking.status !== "cancelled" && booking.checkin <= isoDate && booking.checkout > isoDate),
    };
  });

  return (
    <>
      <div className="weekdays" aria-hidden="true">{["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendarGrid" aria-label="Захиалгын календар">
        {days.map(({ date, isoDate, dayBookings }) => (
          <button
            key={isoDate}
            type="button"
            className={`calendarDay${date.getMonth() !== month ? " isOutside" : ""}${isoDate === today ? " isToday" : ""}`}
            disabled={!dayBookings.length}
            onClick={() => dayBookings.length && onSelect(dayBookings[0])}
            aria-label={`${formatDate(isoDate)}${dayBookings.length ? `, ${dayBookings.length} захиалга` : ""}`}
          >
            <span className="dayNumber">{date.getDate()}</span>
            {dayBookings.length > 0 && <span className="dayBookings">{dayBookings.slice(0, 2).map((booking) => <span className={`dayBooking ${booking.status}`} key={booking.id}>{booking.guestName || "Нэргүй"}</span>)}</span>}
          </button>
        ))}
      </div>
    </>
  );
}

export default function AdminPage() {
  const { admin, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [adminsError, setAdminsError] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [editing, setEditing] = useState(null);
  const [invitingAdmin, setInvitingAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState("");

  const loadBookings = useCallback(async () => {
    setLoadError("");
    try {
      const response = await bookingApi.list({ page: "1", limit: "100" });
      setBookings(response.data);
    } catch (requestError) {
      setLoadError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAdmins = useCallback(async () => {
    setAdminsError("");
    try {
      setAdmins(await adminUserApi.list());
    } catch (requestError) {
      setAdminsError(requestError.message);
    } finally {
      setAdminsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
    loadAdmins();
  }, [loadAdmins, loadBookings]);

  const stats = useMemo(() => {
    const today = toISODate(new Date());
    const now = new Date();
    const monthStart = toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 1));
    const nights = new Set();
    bookings.filter((item) => item.status === "confirmed").forEach((item) => {
      let date = item.checkin < monthStart ? monthStart : item.checkin;
      const end = item.checkout > monthEnd ? monthEnd : item.checkout;
      while (date < end) { nights.add(date); date = addDays(date, 1); }
    });
    return {
      confirmed: bookings.filter((item) => item.status === "confirmed" && item.checkout >= today).length,
      pending: bookings.filter((item) => item.status === "pending").length,
      nights: nights.size,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("mn");
    return bookings
      .filter((booking) => statusFilter === "all" || booking.status === statusFilter)
      .filter((booking) => `${booking.guestName || ""} ${booking.phone || ""} ${booking.email || ""}`.toLocaleLowerCase("mn").includes(query))
      .sort((a, b) => a.checkin.localeCompare(b.checkin));
  }, [bookings, search, statusFilter]);

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  async function saveBooking(draft) {
    const existing = bookings.some((item) => item.id === draft.id);
    const payload = {
      ...draft,
    };
    delete payload.id;
    delete payload.createdAt;
    delete payload.updatedAt;
    if (existing) await bookingApi.update(draft.id, payload);
    else await bookingApi.createAdmin(payload);
    await loadBookings();
    setEditing(null);
    notify(existing ? "Захиалгыг шинэчиллээ." : "Шинэ захиалга нэмлээ.");
  }

  async function deleteBooking(booking) {
    if (!window.confirm(`${booking.guestName || "Энэ"} захиалгыг устгах уу?`)) return;
    try {
      await bookingApi.remove(booking.id);
      await loadBookings();
      setEditing(null);
      notify("Захиалгыг устгалаа.");
    } catch (requestError) {
      setLoadError(requestError.message);
    }
  }

  const monthTitle = new Intl.DateTimeFormat("mn-MN", { month: "long", year: "numeric" }).format(visibleMonth);

  return (
    <div className="adminPage">
      <header className="adminHeader">
        <Link className="adminBrand" to="/admin"><span>Village View</span><small>Admin</small></Link>
        <div className="adminHeaderActions"><span>{admin?.name}</span><Link className="siteLink" to="/">Сайт руу очих <span aria-hidden="true">↗</span></Link><button type="button" onClick={logout}>Гарах</button></div>
      </header>
      <main className="adminMain">
        <section className="pageHeading">
          <div><p className="adminEyebrow">Захиалгын удирдлага</p><h1>Сайн байна уу.</h1><p>Захиалгатай өдрүүдээ харах, хүсэлт батлах болон огноог засах боломжтой.</p></div>
          <button className="adminPrimaryButton" type="button" onClick={() => setEditing(newBooking())}>Шинэ захиалга <span>＋</span></button>
        </section>
        <section className="statsGrid" aria-label="Захиалгын тойм">
          <article className="statCard"><span>Баталгаажсан</span><strong>{stats.confirmed}</strong><small>идэвхтэй захиалга</small></article>
          <article className="statCard"><span>Хүлээгдэж буй</span><strong>{stats.pending}</strong><small>шинэ хүсэлт</small></article>
          <article className="statCard"><span>Энэ сард</span><strong>{stats.nights}</strong><small>захиалгатай шөнө</small></article>
        </section>
        <section className="adminPanel calendarPanel">
          <div className="panelHeader calendarHeader">
            <div><p className="panelKicker">Календар</p><h2>{monthTitle}</h2></div>
            <div className="calendarControls">
              <button type="button" onClick={() => { const now = new Date(); setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1)); }}>Өнөөдөр</button>
              <button type="button" aria-label="Өмнөх сар" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}>←</button>
              <button type="button" aria-label="Дараагийн сар" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}>→</button>
            </div>
          </div>
          <div className="calendarLegend"><span><i className="confirmedDot" /> Баталгаажсан</span><span><i className="pendingDot" /> Хүлээгдэж буй</span></div>
          <Calendar visibleMonth={visibleMonth} bookings={bookings} onSelect={(booking) => setEditing({ ...booking })} />
        </section>
        <section className="adminPanel bookingsPanel">
          <div className="panelHeader bookingsHeader">
            <div><p className="panelKicker">Жагсаалт</p><h2>Бүх захиалга</h2></div>
            <div className="filters">
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Нэр эсвэл утсаар хайх" aria-label="Захиалга хайх" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Төлөвөөр шүүх"><option value="all">Бүх төлөв</option><option value="pending">Хүлээгдэж буй</option><option value="confirmed">Баталгаажсан</option><option value="cancelled">Цуцалсан</option></select>
            </div>
          </div>
          <div className="tableWrap">
            {loadError ? <div className="emptyState"><strong>Серверийн алдаа</strong><p>{loadError}</p><button className="editButton" type="button" onClick={loadBookings}>Дахин оролдох</button></div> : loading ? <div className="emptyState"><strong>Уншиж байна...</strong></div> : filteredBookings.length ? (
              <table><thead><tr><th>Зочин</th><th>Огноо</th><th>Хүн</th><th>Холбоо барих</th><th>Төлөв</th><th /></tr></thead>
                <tbody>{filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td><strong>{booking.guestName || "Нэргүй"}</strong><small>{booking.createdAt ? `Үүсгэсэн: ${formatDate(booking.createdAt.slice(0, 10))}` : ""}</small></td>
                    <td><strong>{formatDate(booking.checkin)} — {formatDate(booking.checkout)}</strong><small>{countNights(booking.checkin, booking.checkout)} шөнө</small></td>
                    <td>{booking.guests || 1}</td>
                    <td><strong>{booking.phone || "—"}</strong><small>{booking.email || "И-мэйлгүй"}</small></td>
                    <td><span className={`statusBadge ${booking.status}`}>{STATUS_LABELS[booking.status]}</span></td>
                    <td><button className="editButton" type="button" onClick={() => setEditing({ ...booking })}>Засах</button></td>
                  </tr>
                ))}</tbody>
              </table>
            ) : <div className="emptyState"><strong>Захиалга олдсонгүй</strong><p>Шүүлтүүрээ өөрчлөх эсвэл шинэ захиалга нэмнэ үү.</p></div>}
          </div>
        </section>
        <AdminUsersPanel
          admins={admins}
          currentAdmin={admin}
          loading={adminsLoading}
          error={adminsError}
          onRetry={loadAdmins}
          onInvite={() => setInvitingAdmin(true)}
          onChanged={loadAdmins}
          notify={notify}
        />
      </main>
      {editing && <BookingEditor key={editing.id || "new"} booking={editing} bookings={bookings} onClose={() => setEditing(null)} onSave={saveBooking} onDelete={deleteBooking} />}
      {invitingAdmin && <InviteAdminEditor onClose={() => setInvitingAdmin(false)} onChanged={loadAdmins} onInvited={async () => { await loadAdmins(); setInvitingAdmin(false); notify("Админ урилгыг илгээлээ."); }} />}
      <div className={`adminToast${toast ? " isVisible" : ""}`} role="status">{toast}</div>
    </div>
  );
}
