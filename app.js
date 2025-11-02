document.addEventListener("DOMContentLoaded", function() {
  // === MAPA (Esri.WorldImagery) ===
  const map = L.map("map").setView([53.430127, 14.564802], 18);
  L.tileLayer.provider("Esri.WorldImagery").addTo(map);

  // === ELEMENTY DOM ===
  const btnGetLocation = document.getElementById("getLocation");
  const btnSave = document.getElementById("saveButton");
  const coordsEl = document.getElementById("coords");
  const rasterCanvas = document.getElementById("rasterMap");
  const puzzleContainer = document.getElementById("puzzle-container");
  const dropZoneContainer = document.getElementById("drop-zone-container");

  let currentMarker = null;

  // === GEOLOKALIZACJA ===
  btnGetLocation.addEventListener("click", function() {
    if (!navigator.geolocation) {
      alert("Twoja przeglądarka nie obsługuje geolokalizacji.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        map.setView([lat, lon], 18);

        coordsEl.textContent = `Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`;

        if (currentMarker) {
          currentMarker.setLatLng([lat, lon]);
        } else {
          currentMarker = L.marker([lat, lon]).addTo(map).bindPopup("Tu jesteś!");
        }
      },
      (err) => {
        alert("Nie udało się pobrać lokalizacji: " + err.message);
      }
    );
  });

  // === ZAPIS MAPY DO CANVASA ===
  btnSave.addEventListener("click", function() {
    leafletImage(map, function(err, canvas) {
      if (err) {
        console.error("Błąd zapisu mapy:", err);
        return;
      }

      // Przerysuj na nasz canvas
      rasterCanvas.width = canvas.width;
      rasterCanvas.height = canvas.height;
      const ctx = rasterCanvas.getContext("2d");
      ctx.drawImage(canvas, 0, 0);

      rasterCanvas.style.display = "block";

      // Wygeneruj puzzle
      generatePuzzle(canvas);
    });
  });

  // === GENEROWANIE PUZZLI ===
  function generatePuzzle(canvas) {
  puzzleContainer.innerHTML = "";
  dropZoneContainer.innerHTML = "";

  const rows = 4;
  const cols = 4;
  const pieceWidth = canvas.width / cols;
  const pieceHeight = canvas.height / rows;

  // Ustaw rozmiar planszy 1:1 jak canvas
  dropZoneContainer.style.width = `${canvas.width}px`;
  dropZoneContainer.style.height = `${canvas.height}px`;
  dropZoneContainer.style.display = "grid";
  dropZoneContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  dropZoneContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  dropZoneContainer.style.gap = "0px";

  // Ogranicz szerokość kontenera rozsypki, aby nie rozjeżdżał strony
  puzzleContainer.style.maxWidth = `${canvas.width}px`;
  puzzleContainer.style.width = "100%";

  const pieces = [];

  // Wycinanie kawałków i tworzenie <img> z ustawionymi rozmiarami (display)
  // displayW/H = połowa rozmiaru kawałka (możesz zmieniać 0.5 -> 0.45 itp.)
  const displayFactor = 0.5;
  const displayW = Math.round(pieceWidth * displayFactor);
  const displayH = Math.round(pieceHeight * displayFactor);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const pieceCanvas = document.createElement("canvas");
      pieceCanvas.width = pieceWidth;
      pieceCanvas.height = pieceHeight;
      const pctx = pieceCanvas.getContext("2d");
      pctx.drawImage(
        canvas,
        x * pieceWidth,
        y * pieceHeight,
        pieceWidth,
        pieceHeight,
        0,
        0,
        pieceWidth,
        pieceHeight
      );

      const img = document.createElement("img");
      img.src = pieceCanvas.toDataURL();
      img.classList.add("puzzle-piece");
      img.id = `piece-${y}-${x}`;
      img.draggable = true;

      // ustawiamy rzeczywisty rozmiar wyświetlany (połowa pola)
      img.style.width = `${displayW}px`;
      img.style.height = `${displayH}px`;

      // opcjonalna mała klasa, możesz w CSS dopracować wygląd
      img.classList.add("small");

      // Obsługa przeciągania (start/koniec)
      img.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", img.id);
        setTimeout(() => (img.style.visibility = "hidden"), 0);
      });
      img.addEventListener("dragend", (e) => {
        e.target.style.visibility = "visible";
      });

      // zapamiętaj oryginalne rozmiary w dataset (będzie wygodne)
      img.dataset.pw = pieceWidth;
      img.dataset.ph = pieceHeight;
      img.dataset.dw = displayW;
      img.dataset.dh = displayH;

      pieces.push(img);
    }
  }

  // Wymieszaj puzzle
  shuffle(pieces);

  // Dodaj puzzle do kontenera (rozsypane) — one mają już styl width/height połowy
  pieces.forEach((p) => {
    puzzleContainer.appendChild(p);
  });

  // Tworzenie siatki (planszy)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dz = document.createElement("div");
      dz.classList.add("drop-zone");
      dz.dataset.targetId = `piece-${y}-${x}`;
      // ustaw rozmiar pola dokładnie jak pieceWidth/pieceHeight
      dz.style.width = `${pieceWidth}px`;
      dz.style.height = `${pieceHeight}px`;

      dz.addEventListener("dragover", (e) => e.preventDefault());
      dz.addEventListener("drop", (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        const piece = document.getElementById(id);
        if (!piece) return;

        // jeśli już coś jest w strefie — przenieś to z powrotem do puli i zmniejsz
        if (dz.firstChild) {
          const existing = dz.firstChild;
          // jeśli istnieje element, przywróć mu rozmiar "display" i dodaj do puzzleContainer
          existing.style.width = `${existing.dataset.dw}px`;
          existing.style.height = `${existing.dataset.dh}px`;
          existing.classList.add("small");
          puzzleContainer.appendChild(existing);
        }

        // dopasuj puzzla do pełnego rozmiaru pola (1:1)
        piece.style.width = `${piece.dataset.pw}px`;
        piece.style.height = `${piece.dataset.ph}px`;
        piece.classList.remove("small");

        dz.appendChild(piece);

        checkCompletion();
      });

      dropZoneContainer.appendChild(dz);
    }
  }
}


  // === SPRAWDZANIE UKOŃCZENIA ===
  function checkCompletion() {
    const zones = document.querySelectorAll(".drop-zone");
    let complete = true;

    zones.forEach((z) => {
      const child = z.firstChild;
      if (!child || child.id !== z.dataset.targetId) {
        complete = false;
      }
    });

    if (complete) {
      if (Notification.permission === "granted") {
        new Notification("🎉 Gratulacje! Ułożyłeś mapę!");
      } else {
        alert("🎉 Gratulacje! Ułożyłeś mapę!");
      }
    }
  }

  // === FUNKCJA TASOWANIA ===
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
});
