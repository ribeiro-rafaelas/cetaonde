const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const validateTripForm = (form) => {
  const destinationInput = form.querySelector('input[name="destination"]');
  const countryInput = form.querySelector('input[name="country"]');
  const startInput = form.querySelector('input[name="start_date"]');
  const endInput = form.querySelector('input[name="end_date"]');

  let isValid = true;

  [destinationInput, countryInput, startInput, endInput].forEach((input) => {
    if (!input.value.trim()) {
      input.classList.add('is-invalid');
      isValid = false;
    } else {
      input.classList.remove('is-invalid');
    }
  });

  const startDate = new Date(startInput.value);
  const endDate = new Date(endInput.value);

  if (startInput.value && endInput.value && startDate > endDate) {
    endInput.classList.add('is-invalid');
    endInput.nextElementSibling.textContent =
      'A data de termino deve ser posterior ou igual a data de inicio.';
    isValid = false;
  } else if (endInput.value) {
    endInput.classList.remove('is-invalid');
    endInput.nextElementSibling.textContent = 'Informe a data de termino.';
  }

  return isValid;
};

const attachCreateFormValidation = () => {
  const form = document.getElementById('trip-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    if (!validateTripForm(form)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
};

const attachDeleteHandlers = () => {
  const buttons = document.querySelectorAll('.delete-trip-btn');
  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const tripId = button.dataset.tripId;
      const confirmation = window.confirm('Tem certeza de que deseja excluir esta viagem?');
      if (!confirmation) return;

      try {
        const response = await fetch(`/trip/${tripId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Falha ao excluir viagem.');
        }

        if (window.location.pathname === `/trip/${tripId}`) {
          window.location.href = '/';
        } else {
          window.location.reload();
        }
      } catch (error) {
        alert(error.message);
      }
    });
  });
};

const buildPhotoThumbHtml = (photo) => {
  const caption = photo.caption ? `<figcaption>${escapeHtml(photo.caption)}</figcaption>` : '';
  return `
    <figure class="photo-thumb">
      <img src="${photo.filePath}" alt="${escapeHtml(photo.caption || 'Foto da viagem')}" />
      ${caption}
    </figure>
  `;
};

const buildAlbumCardHtml = (album) => {
  const cover = album.coverPhotoPath
    ? `<img src="${album.coverPhotoPath}" class="w-100 h-100 object-fit-cover" alt="Capa do album ${escapeHtml(
        album.title
      )}" />`
    : `<div class="album-cover__placeholder d-flex flex-column align-items-center justify-content-center h-100 text-center text-white">
         <i class="bi bi-images display-6 mb-2"></i>
         <p class="mb-0 small">Adicione a primeira foto para revelar a natureza deste album.</p>
       </div>`;

  const photosHtml =
    album.photos && album.photos.length
      ? album.photos.map(buildPhotoThumbHtml).join('')
      : '<p class="text-muted small mb-0">Nenhuma foto adicionada ainda.</p>';

  return `
    <div class="col-12 col-md-6" data-album-id="${album.id}">
      <div class="card album-card h-100 border-0 shadow-sm">
        <div class="album-cover position-relative overflow-hidden">
          ${cover}
        </div>
        <div class="card-body">
          <h3 class="h6 mb-1">${escapeHtml(album.title)}</h3>
          <p class="text-muted small mb-3">${escapeHtml(album.description || 'Sem descricao cadastrada.')}</p>
          <div class="album-photos-grid mb-3" data-empty-text="Nenhuma foto adicionada ainda.">
            ${photosHtml}
          </div>
          <form
            class="photo-upload-form needs-validation"
            action="/trip/${album.tripId}/albums/${album.id}/photos"
            method="post"
            data-trip-id="${album.tripId}"
            data-album-id="${album.id}"
            enctype="multipart/form-data"
            novalidate
          >
            <div class="mb-2">
              <label class="form-label">Adicionar foto</label>
              <input type="file" name="photo" accept="image/*" class="form-control" required />
              <div class="invalid-feedback">Selecione uma imagem nos formatos JPG, PNG, WEBP ou GIF.</div>
            </div>
            <div class="mb-3">
              <input
                type="text"
                name="caption"
                class="form-control"
                placeholder="Legenda (opcional)"
              />
            </div>
            <button type="submit" class="btn btn-outline-success btn-sm">
              <i class="bi bi-cloud-upload me-1"></i>Enviar foto
            </button>
            <div class="upload-feedback small mt-2 text-danger d-none"></div>
          </form>
        </div>
      </div>
    </div>
  `;
};

const refreshAlbumGridEmptyState = () => {
  const grid = document.getElementById('album-grid');
  if (!grid) return;
  const infoAlert = grid.querySelector('.alert');
  const albumCards = grid.querySelectorAll('[data-album-id]');

  if (albumCards.length && infoAlert) {
    infoAlert.remove();
  }
};

const insertAlbumCard = (album) => {
  const grid = document.getElementById('album-grid');
  if (!grid) return;

  refreshAlbumGridEmptyState();
  grid.insertAdjacentHTML('afterbegin', buildAlbumCardHtml(album));
  attachPhotoUploadHandlers();
};

const attachAlbumCreationHandler = () => {
  const form = document.getElementById('new-album-form');
  if (!form) return;

  const feedback = document.getElementById('album-feedback');
  const collapseElement = document.getElementById('new-album-collapse');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    feedback?.classList.add('d-none');

    const tripId = form.dataset.tripId;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (!payload.title?.trim()) {
      feedback.textContent = 'Informe um titulo para o album.';
      feedback.classList.remove('d-none');
      return;
    }

    try {
      const response = await fetch(`/trip/${tripId}/albums`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.errors ? data.errors.join(' ') : data.message);
      }

      form.reset();
      feedback.classList.add('d-none');
      insertAlbumCard(data.album);

      if (collapseElement && window.bootstrap) {
        const collapseInstance = window.bootstrap.Collapse.getOrCreateInstance(collapseElement, {
          toggle: false
        });
        collapseInstance.hide();
      }
    } catch (error) {
      feedback.textContent = error.message || 'Nao foi possivel criar o album.';
      feedback.classList.remove('d-none');
    }
  });
};

const attachPhotoUploadHandlers = () => {
  const forms = document.querySelectorAll('.photo-upload-form');
  if (!forms.length) return;

  forms.forEach((form) => {
    if (form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const tripId = form.dataset.tripId;
      const albumId = form.dataset.albumId;
      const fileInput = form.querySelector('input[type="file"]');
      const feedback = form.querySelector('.upload-feedback');
      const submitButton = form.querySelector('button[type="submit"]');

      feedback?.classList.add('d-none');
      feedback.textContent = '';

      if (!fileInput.files.length) {
        fileInput.classList.add('is-invalid');
        feedback.textContent = 'Selecione uma imagem para enviar.';
        feedback.classList.remove('d-none');
        return;
      }

      fileInput.classList.remove('is-invalid');

      const formData = new FormData(form);

      try {
        submitButton.disabled = true;
        const response = await fetch(`/trip/${tripId}/albums/${albumId}/photos`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.errors ? data.errors.join(' ') : data.message);
        }

        form.reset();
        feedback.classList.add('d-none');

        const albumCard = form.closest('[data-album-id]');
        if (albumCard) {
          const photosGrid = albumCard.querySelector('.album-photos-grid');
          if (photosGrid) {
            if (!photosGrid.dataset.emptyTextHandled) {
              const emptyMessage = photosGrid.querySelector('.text-muted');
              if (emptyMessage) {
                emptyMessage.remove();
              }
              photosGrid.dataset.emptyTextHandled = 'true';
            }
            photosGrid.insertAdjacentHTML('afterbegin', buildPhotoThumbHtml(data.photo));
          }

          if (data.album?.coverPhotoPath) {
            const coverContainer = albumCard.querySelector('.album-cover');
            if (coverContainer) {
              coverContainer.innerHTML = `<img src="${data.album.coverPhotoPath}" class="w-100 h-100 object-fit-cover" alt="Capa do album ${escapeHtml(
                data.album.title || ''
              )}" />`;
            }

            const heroBackdrop = document.querySelector('.trip-hero__backdrop');
            if (heroBackdrop) {
              heroBackdrop.style.backgroundImage = `linear-gradient(135deg, rgba(16, 65, 38, 0.85), rgba(3, 26, 64, 0.85)), url('${data.album.coverPhotoPath}')`;
            }
          }
        }
      } catch (error) {
        feedback.textContent = error.message || 'Nao foi possivel enviar a foto.';
        feedback.classList.remove('d-none');
      } finally {
        submitButton.disabled = false;
      }
    });
  });
};

const updateTripSummary = (trip) => {
  const heroDestination = document.getElementById('trip-destination');
  const heroCountry = document.getElementById('trip-country');
  const heroPeriod = document.getElementById('trip-period');
  const summaryDestination = document.getElementById('trip-summary-destination');
  const summaryCountry = document.getElementById('trip-summary-country');
  const notesField = document.getElementById('trip-notes');
  const mapElement = document.getElementById('trip-map');
  const heroBackdrop = document.querySelector('.trip-hero__backdrop');

  if (heroDestination) {
    heroDestination.textContent = trip.destination;
  }
  if (heroCountry) {
    heroCountry.textContent = trip.country;
  }
  if (summaryDestination) {
    summaryDestination.textContent = trip.destination;
  }
  if (summaryCountry) {
    summaryCountry.textContent = trip.country;
  }
  if (heroPeriod) {
    const start = new Date(trip.startDate).toLocaleDateString('pt-BR');
    const end = new Date(trip.endDate).toLocaleDateString('pt-BR');
    heroPeriod.textContent = `${start} ate ${end}`;
  }
  if (notesField) {
    if (trip.notes?.trim()) {
      notesField.textContent = trip.notes;
      notesField.classList.remove('text-muted');
    } else {
      notesField.textContent = 'Sem anotacoes adicionais.';
      notesField.classList.add('text-muted');
    }
  }
  if (mapElement) {
    mapElement.dataset.destination = trip.destination;
    mapElement.dataset.country = trip.country;
    updateMapLocation(trip.destination, trip.country);
  }
  if (heroBackdrop && trip.coverPhotoPath) {
    heroBackdrop.style.backgroundImage = `linear-gradient(135deg, rgba(16, 65, 38, 0.85), rgba(3, 26, 64, 0.85)), url('${trip.coverPhotoPath}')`;
  }
};

let mapInstance;
let mapMarker;
let mapElementRef;
let mapErrorAlert;

const clearMapError = () => {
  if (mapErrorAlert) {
    mapErrorAlert.remove();
    mapErrorAlert = null;
  }
};

const updateMapLocation = (destination, country) => {
  if (!mapInstance || !mapElementRef || typeof fetch === 'undefined') return;

  clearMapError();

  const query = encodeURIComponent(`${destination}, ${country}`);

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
    .then((response) => response.json())
    .then((results) => {
      if (!results.length) {
        throw new Error('Localizacao nao encontrada.');
      }

      const { lat, lon, display_name: displayName } = results[0];
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      mapInstance.setView([latitude, longitude], 6);

      if (mapMarker) {
        mapMarker.remove();
      }

      mapMarker = L.marker([latitude, longitude]).addTo(mapInstance).bindPopup(displayName);
      mapMarker.openPopup();
    })
    .catch(() => {
      if (mapMarker) {
        mapMarker.remove();
        mapMarker = null;
      }

      mapInstance.setView([20, 0], 2);

      mapErrorAlert = document.createElement('div');
      mapErrorAlert.className = 'alert alert-warning mt-3';
      mapErrorAlert.textContent = 'Nao foi possivel carregar o mapa para este destino.';
      mapElementRef.insertAdjacentElement('afterend', mapErrorAlert);
    });
};

const attachEditFormHandler = () => {
  const form = document.getElementById('edit-trip-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateTripForm(form)) {
      return;
    }

    const tripId = form.dataset.tripId;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const feedback = document.getElementById('edit-feedback');

    try {
      const response = await fetch(`/trip/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors ? data.errors.join(' ') : data.message);
      }

      feedback.classList.remove('d-none', 'alert-danger');
      feedback.classList.add('alert', 'alert-success');
      feedback.textContent = 'Viagem atualizada com sucesso!';

      updateTripSummary(data.trip);
    } catch (error) {
      feedback.classList.remove('d-none', 'alert-success');
      feedback.classList.add('alert', 'alert-danger');
      feedback.textContent = error.message || 'Nao foi possivel salvar as alteracoes.';
    }
  });
};

const initMap = () => {
  mapElementRef = document.getElementById('trip-map');
  if (!mapElementRef || typeof L === 'undefined') return;

  mapInstance = L.map(mapElementRef).setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> colaboradores'
  }).addTo(mapInstance);

  updateMapLocation(mapElementRef.dataset.destination, mapElementRef.dataset.country);
};

document.addEventListener('DOMContentLoaded', () => {
  attachCreateFormValidation();
  attachDeleteHandlers();
  attachEditFormHandler();
  attachAlbumCreationHandler();
  attachPhotoUploadHandlers();
  initMap();
});
