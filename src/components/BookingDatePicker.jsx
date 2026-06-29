import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, dateFromISO, formatDate, toISODate } from "../lib/dates";
const WEEKDAYS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];
export default function BookingDatePicker({ bookedDates, loading, checkin, checkout, onCheckin, onCheckout }) {
  const [activeField, setActiveField] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const pickerRef = useRef(null);
  const today = toISODate(new Date());

  const occupiedDates = useMemo(() => new Set(bookedDates), [bookedDates]);

  useEffect(() => {
    const closePicker = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) setActiveField(null);
    };
    document.addEventListener("pointerdown", closePicker);
    return () => document.removeEventListener("pointerdown", closePicker);
  }, []);

  function openPicker(field) {
    const selectedDate = field === "checkin" ? checkin : checkout;
    const base = selectedDate ? dateFromISO(selectedDate) : checkin ? dateFromISO(checkin) : new Date();
    setVisibleMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setActiveField((current) => current === field ? null : field);
  }

  function intervalContainsBookedDate(startDate, endDate) {
    if (!startDate) return false;
    let date = addDays(startDate, 1);
    while (date < endDate) {
      if (occupiedDates.has(date)) return true;
      date = addDays(date, 1);
    }
    return false;
  }

  function isDisabled(isoDate) {
    if (isoDate < today || occupiedDates.has(isoDate)) return true;
    if (activeField === "checkout") {
      return !checkin || isoDate <= checkin || intervalContainsBookedDate(checkin, isoDate);
    }
    return false;
  }

  function selectDate(isoDate) {
    if (activeField === "checkin") {
      onCheckin(isoDate);
      if (!checkout || checkout <= isoDate || intervalContainsBookedDate(isoDate, checkout)) onCheckout("");
      setActiveField("checkout");
      return;
    }
    onCheckout(isoDate);
    setActiveField(null);
  }

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return { date, isoDate: toISODate(date) };
  });

  return (
    <div className="bookingDatePicker" ref={pickerRef}>
      <div className="datePickerFields">
        <div className="formField">
          <span className="dateFieldLabel">Ирэх өдөр</span>
          <button className={`datePickerTrigger${activeField === "checkin" ? " isActive" : ""}`} type="button" onClick={() => openPicker("checkin")} disabled={loading}>
            <span>{loading ? "Календар уншиж байна..." : checkin ? formatDate(checkin, { month: "long" }) : "Өдөр сонгох"}</span><span aria-hidden="true">▾</span>
          </button>
        </div>
        <div className="formField">
          <span className="dateFieldLabel">Буцах өдөр</span>
          <button className={`datePickerTrigger${activeField === "checkout" ? " isActive" : ""}`} type="button" onClick={() => openPicker("checkout")} disabled={!checkin || loading}>
            <span>{checkout ? formatDate(checkout, { month: "long" }) : "Өдөр сонгох"}</span><span aria-hidden="true">▾</span>
          </button>
        </div>
      </div>

      {activeField && (
        <div className="datePickerPopover">
          <div className="datePickerHeader">
            <button type="button" onClick={() => setVisibleMonth(new Date(year, month - 1, 1))} aria-label="Өмнөх сар">←</button>
            <strong>{new Intl.DateTimeFormat("mn-MN", { month: "long", year: "numeric" }).format(visibleMonth)}</strong>
            <button type="button" onClick={() => setVisibleMonth(new Date(year, month + 1, 1))} aria-label="Дараагийн сар">→</button>
          </div>
          <div className="datePickerWeekdays" aria-hidden="true">{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="datePickerGrid">
            {days.map(({ date, isoDate }) => {
              const booked = occupiedDates.has(isoDate);
              const disabled = isDisabled(isoDate) || date.getMonth() !== month;
              const selected = isoDate === checkin || isoDate === checkout;
              return (
                <button
                  type="button"
                  key={isoDate}
                  disabled={disabled}
                  className={`${date.getMonth() !== month ? "isOutside " : ""}${booked ? "isBooked " : ""}${selected ? "isSelected" : ""}`.trim()}
                  onClick={() => selectDate(isoDate)}
                  aria-label={`${formatDate(isoDate, { month: "long" })}${booked ? ", захиалгатай" : ""}`}
                  title={booked ? "Захиалгатай" : undefined}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="datePickerLegend"><span><i /> Захиалгатай өдөр</span><button type="button" onClick={() => setActiveField(null)}>Хаах</button></div>
        </div>
      )}
    </div>
  );
}
