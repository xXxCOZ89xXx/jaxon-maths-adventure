// Display-only helpers. Never round or rewrite authoritative wallet amounts.
(function (root) {
  const finite = (value) =>
    Number.isFinite(Number(value)) ? Number(value) : 0;
  root.V3Presentation = {
    date: (value) =>
      Number.isFinite(Date.parse(value))
        ? new Intl.DateTimeFormat("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Europe/London",
          }).format(new Date(value))
        : "Unknown time",
    coins: (value) =>
      new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(
        finite(value),
      ),
    minutes: (value) =>
      new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(
        finite(value),
      ),
    recoveryMessage: (error) =>
      !error
        ? "If this staging account exists, a private recovery link will arrive."
        : Number(error.status) === 429
          ? "Too many recovery requests. Please wait before trying again. Email recovery delivery is pending staging email-service configuration."
          : "Recovery request could not be sent. Please try later. No account details have been shared.",
  };
})(typeof module === "object" ? module.exports : window);
