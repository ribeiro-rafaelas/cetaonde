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
      'A data de término deve ser posterior ou igual à data de início.';
    isValid = false;
  } else if (endInput.value) {
    endInput.classList.remove('is-invalid');
    endInput.nextElementSibling.textContent = 'Informe a data de término.';
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
      const confirmation = window.confirm('Tem certeza que deseja excluir esta viagem?');
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

const updateTripSummary = (trip) => {
  const destinationHeading = document.querySelector('h1.h3');
  const countryParagraph = document.querySelector('h1.h3 + p.text-muted');
  const destinationField = document.getElementById('trip-destination');
  const countryField = document.getElementById('trip-country');
  const periodField = document.getElementById('trip-period');
  const notesField = document.getElementById('trip-notes');
  const mapElement = document.getElementById('trip-map');

  if (destinationHeading) {
    destinationHeading.textContent = trip.destination;
  }
  if (countryParagraph) {
    countryParagraph.textContent = trip.country;
  }
  if (destinationField) {
    destinationField.textContent = trip.destination;
  }
  if (countryField) {
    countryField.textContent = trip.country;
  }
  if (periodField) {
    const start = new Date(trip.startDate).toLocaleDateString('pt-BR');
    const end = new Date(trip.endDate).toLocaleDateString('pt-BR');
    periodField.textContent = `${start} até ${end}`;
  }
  if (notesField) {
    notesField.textContent = trip.notes?.trim()
      ? trip.notes
      : 'Sem anotações adicionais.';
    if (!trip.notes?.trim()) {
      notesField.classList.add('text-muted');
    } else {
      notesField.classList.remove('text-muted');
    }
  }

  if (mapElement) {
    mapElement.dataset.destination = trip.destination;
    mapElement.dataset.country = trip.country;
    updateMapLocation(trip.destination, trip.country);
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
        throw new Error('Localização não encontrada.');
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
      mapErrorAlert.textContent = 'Não foi possível carregar o mapa para este destino.';
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
      feedback.textContent = error.message || 'Não foi possível salvar as alterações.';
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
  initMap();
});
