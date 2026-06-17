const target = document.querySelector("#fixture-list");

try {
  const response = await fetch("./codec-fixtures.json");
  const data = await response.json();
  target.innerHTML = data.fixtures.map((fixture) => {
    const labels = fixture.expectedRiskLabels.join(", ");
    return `
      <article class="fixture-card">
        <strong>${escapeHtml(fixture.id)} / ${escapeHtml(fixture.direction)}</strong>
        <p>${escapeHtml(fixture.sourceText)}</p>
        <small>${escapeHtml(labels)} · ${escapeHtml(fixture.reviewStatus)}</small>
      </article>
    `;
  }).join("");
} catch {
  target.textContent = "Fixture data unavailable. The JSON has moved to a new folder with a confident name.";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
