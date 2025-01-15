/****************************************************
 * script.js
 ****************************************************/

/**
 * Removes commas and returns float.
 */
function unformatNumber(value) {
  return parseFloat(value.replace(/,/g, '')) || 0;
}

/**
 * showError / hideError
 */
function showError(errorId, message) {
  const el = document.getElementById(errorId);
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
}
function hideError(errorId) {
  const el = document.getElementById(errorId);
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

/**
 * updateProgressBar
 */
function updateProgressBar() {
  const numberInputs = document.querySelectorAll('input[data-type="number"]');
  const total = numberInputs.length;
  let filled = 0;
  numberInputs.forEach(inp => {
    if (unformatNumber(inp.value) > 0) filled++;
  });
  const pct = Math.round((filled / total) * 100);
  document.getElementById('formProgress').style.width = pct + '%';
}

/**
 * updateTimelineFields
 */
function updateTimelineFields() {
  const cAge = unformatNumber(document.getElementById('currentAge').value);
  const rAge = unformatNumber(document.getElementById('retireAge').value);
  const dAge = unformatNumber(document.getElementById('deathAge').value);

  const savingsPeriod = rAge - cAge;
  const spendingPeriod = dAge - rAge;

  // Ensure non-negative
  document.getElementById('savingsPeriod').textContent = (savingsPeriod >= 0) ? savingsPeriod : 0;
  document.getElementById('spendingPeriod').textContent = (spendingPeriod >= 0) ? spendingPeriod : 0;
}

/**
 * Basic validation
 */
function validateInputs() {
  const cAge = unformatNumber(document.getElementById('currentAge').value);
  const rAge = unformatNumber(document.getElementById('retireAge').value);
  const dAge = unformatNumber(document.getElementById('deathAge').value);

  let valid = true;

  if (cAge <= 0) {
    showError('currentAgeError', 'กรุณาใส่อายุที่ถูกต้อง!');
    valid = false;
  } else {
    hideError('currentAgeError');
  }

  if (rAge <= cAge) {
    showError('retireAgeError', 'อายุเกษียณต้องมากกว่าอายุปัจจุบัน!');
    valid = false;
  } else {
    hideError('retireAgeError');
  }

  if (dAge <= rAge) {
    showError('deathAgeError', 'อายุขัยต้องมากกว่าอายุเกษียณ!');
    valid = false;
  } else {
    hideError('deathAgeError');
  }

  updateProgressBar();
  return valid;
}

/**
 * Real-time comma + decimal
 */
function addCommaEvent(input, onAfterFormat) {
  input.addEventListener('input', () => {
    const cursorPos = input.selectionStart;
    let raw = input.value.replace(/,/g, '');
    if (!raw) {
      input.value = '';
      return;
    }

    if (!isNaN(raw)) {
      let parts = raw.split('.');
      let intPart = parts[0] || '';
      let decPart = parts[1];
      let formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      let newVal = formattedInt;
      if (decPart !== undefined) {
        newVal += '.' + decPart;
      }
      input.value = newVal;

      // Adjust cursor
      const diff = newVal.length - raw.length;
      input.selectionEnd = cursorPos + diff;
    } else {
      // Non-numeric typed
      input.value =
        input.value.substring(0, cursorPos - 1) +
        input.value.substring(cursorPos);
      input.selectionEnd = cursorPos - 1;
    }

    if (onAfterFormat) onAfterFormat();
  });

  // Clear "0" on focus
  input.addEventListener('focus', () => {
    if (input.value === '0') {
      input.value = '';
    }
  });

  // If empty on blur => '0'
  input.addEventListener('blur', () => {
    if (!input.value.trim()) {
      input.value = '0';
    }
  });
}

/**
 * Press ENTER -> next input
 */
function attachEnterKey(input, inputs) {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const idx = inputs.indexOf(input);
      const nextIdx = idx + 1;
      if (nextIdx < inputs.length) {
        inputs[nextIdx].focus();
      } else {
        const calcBtn = document.getElementById('calculateButton');
        if (calcBtn) calcBtn.focus();
      }
    }
  });
}

/**
 * calculateRetirement - now fully rounding decimals
 */
function calculateRetirement() {
  if (!validateInputs()) return;

  // Gather
  const cAge = unformatNumber(document.getElementById('currentAge').value);
  const rAge = unformatNumber(document.getElementById('retireAge').value);
  const dAge = unformatNumber(document.getElementById('deathAge').value);

  const cSalary = unformatNumber(document.getElementById('currentSalary').value);
  const cExpense = unformatNumber(document.getElementById('currentExpense').value);
  const cSavings = unformatNumber(document.getElementById('currentSavings').value);
  const annReturnBefore = unformatNumber(document.getElementById('annualReturn').value) / 100;
  const inflRate = unformatNumber(document.getElementById('inflationRate').value) / 100;
  const legacy = unformatNumber(document.getElementById('legacy').value);
  const annReturnAfter = unformatNumber(document.getElementById('postRetirementReturn').value) / 100;

  const savingsPeriod = rAge - cAge;
  const spendingPeriod = dAge - rAge;

  // Example formula
  const expenseAtRetire = cExpense * 0.7 * Math.pow(1 + inflRate, savingsPeriod);
  const rateNominalPerMonth = Math.pow(1 + annReturnAfter, 1/12) - 1;
  const rateInflationPerMonth = Math.pow(1 + inflRate, 1/12) - 1;
  const realRatePerMonth = (1 + rateNominalPerMonth)/(1 + rateInflationPerMonth) - 1;

  const totalNeededAfterRetire =
    (expenseAtRetire * (1 - Math.pow(1 + realRatePerMonth, -spendingPeriod * 12))) / realRatePerMonth;

  const legacyPresentValue = legacy / Math.pow(1 + rateNominalPerMonth, spendingPeriod * 12);

  const totalNeeded = totalNeededAfterRetire + legacyPresentValue;
  const totalSavings = cSavings * Math.pow(1 + annReturnBefore, savingsPeriod);

  let needOrSurplus = totalNeeded - totalSavings;

  // monthly saving
  let monthlySaving = 0;
  if (needOrSurplus > 0) {
    const monthlyRate = annReturnBefore / 12;
    const periods = savingsPeriod * 12;
    const denominator = Math.pow(1 + monthlyRate, periods) - 1;
    if (denominator !== 0) {
      monthlySaving = (needOrSurplus * monthlyRate) / denominator;
      monthlySaving = isFinite(monthlySaving) ? monthlySaving : 0;
    } else {
      monthlySaving = needOrSurplus / periods;
    }
  }

  // --- Rounding logic for each result field --- //
  // A helper function to round and format with commas
  const formatRounded = (num) => {
    const rounded = Math.round(num);  // round to nearest integer
    return rounded.toLocaleString();
  };

  // Fill in results (no decimals, fully rounded):
  document.getElementById('spendingPeriodDisplay').textContent =
    savingsPeriod >= 0 ? spendingPeriod.toLocaleString() : 0; // just in case

  document.getElementById('totalMoneyNeededAfterRetire').textContent =
    formatRounded(totalNeededAfterRetire);

  document.getElementById('legacyPresentValue').textContent =
    formatRounded(legacyPresentValue);

  document.getElementById('totalMoneyNeeded').textContent =
    formatRounded(totalNeeded);

  document.getElementById('totalSavings').textContent =
    formatRounded(totalSavings);

  // Remove minus sign if negative
  let absNeedOrSurplus = needOrSurplus < 0 ? -needOrSurplus : needOrSurplus;
  absNeedOrSurplus = Math.round(absNeedOrSurplus); // round
  document.getElementById('needOrSurplus').textContent = absNeedOrSurplus.toLocaleString();

  let monthlySavingRounded = Math.round(monthlySaving);
  document.getElementById('monthlySaving').textContent =
    monthlySavingRounded.toLocaleString();

  // color
  const nsEl = document.getElementById('needOrSurplus');
  if (needOrSurplus > 0) {
    nsEl.style.color = 'red';
  } else if (needOrSurplus < 0) {
    nsEl.style.color = 'green';
  } else {
    nsEl.style.color = '#333';
  }

  // Show results
  document.getElementById('inputPage').style.display = 'none';
  document.getElementById('resultsPage').classList.remove('hidden');
}

/**
 * goBackToForm
 */
function goBackToForm() {
  document.getElementById('resultsPage').classList.add('fade-out');
  setTimeout(() => {
    document.getElementById('resultsPage').classList.add('hidden');
    document.getElementById('inputPage').style.display = 'block';
    document.getElementById('resultsPage').classList.remove('fade-out');
  }, 500);
}

/**
 * resetForm
 */
function resetForm() {
  const inputs = document.querySelectorAll('input[data-type="number"]');
  inputs.forEach(inp => inp.value = '0');

  document.getElementById('formProgress').style.width = '0%';
  document.getElementById('savingsPeriod').textContent = '0';
  document.getElementById('spendingPeriod').textContent = '0';

  document.getElementById('spendingPeriodDisplay').textContent = '0';
  document.getElementById('totalMoneyNeededAfterRetire').textContent = '0.00';
  document.getElementById('legacyPresentValue').textContent = '0.00';
  document.getElementById('totalMoneyNeeded').textContent = '0.00';
  document.getElementById('totalSavings').textContent = '0.00';
  document.getElementById('needOrSurplus').textContent = '0.00';
  document.getElementById('monthlySaving').textContent = '0.00';

  document.getElementById('resultsPage').classList.add('fade-out');
  setTimeout(() => {
    document.getElementById('resultsPage').classList.add('hidden');
    document.getElementById('inputPage').style.display = 'block';
    document.getElementById('resultsPage').classList.remove('fade-out');
  }, 500);
}

/**
 * init
 */
function init() {
  const fieldIDs = [
    'currentAge',
    'retireAge',
    'deathAge',
    'currentSalary',
    'currentExpense',
    'currentSavings',
    'annualReturn',
    'legacy',
    'inflationRate',
    'postRetirementReturn'
  ];
  const inputs = fieldIDs.map(id => document.getElementById(id)).filter(Boolean);

  inputs.forEach(input => {
    addCommaEvent(input, () => {
      updateTimelineFields();
      validateInputs();
    });
  });
  inputs.forEach(input => {
    attachEnterKey(input, inputs);
  });

  // Buttons
  document.getElementById('calculateButton').addEventListener('click', calculateRetirement);
  document.getElementById('editButton').addEventListener('click', goBackToForm);
  document.getElementById('restartButton').addEventListener('click', resetForm);
}

document.addEventListener('DOMContentLoaded', init);
