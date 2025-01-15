/****************************************************
 * script.js
 ****************************************************/

/**
 * Removes commas and returns float. E.g. "1,234.56" -> 1234.56
 */
function unformatNumber(value) {
  return parseFloat(value.replace(/,/g, '')) || 0;
}

/**
 * Show/hide error messages
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
 * updateProgressBar - how many fields have > 0
 */
function updateProgressBar() {
  const numberInputs = document.querySelectorAll('input[data-type="number"]');
  const total = numberInputs.length;
  let filled = 0;
  numberInputs.forEach(inp => {
    if (unformatNumber(inp.value) > 0) {
      filled++;
    }
  });
  const pct = Math.round((filled / total) * 100);
  document.getElementById('formProgress').style.width = pct + '%';
}

/**
 * updateTimelineFields (savingsPeriod, spendingPeriod)
 */
function updateTimelineFields() {
  const cAge = unformatNumber(document.getElementById('currentAge').value);
  const rAge = unformatNumber(document.getElementById('retireAge').value);
  const dAge = unformatNumber(document.getElementById('deathAge').value);

  const savingsPeriod = rAge - cAge;
  const spendingPeriod = dAge - rAge;

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
 * addCommaEvent - real-time comma insertion + decimals
 */
function addCommaEvent(input, onAfterFormat) {
  input.addEventListener('input', () => {
    const cursorPos = input.selectionStart;
    let raw = input.value.replace(/,/g, '');
    if (!raw) {
      input.value = '';
      return;
    }
    // If numeric
    if (!isNaN(raw)) {
      let parts = raw.split('.');
      let intPart = parts[0] || '';
      let decPart = parts[1];
      // Insert commas
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
  // If empty on blur => "0"
  input.addEventListener('blur', () => {
    if (!input.value.trim()) {
      input.value = '0';
    }
  });
}

/**
 * attachEnterKey - pressing ENTER jumps to next field or button
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
        // If last field, focus calculate button
        const calcBtn = document.getElementById('calculateButton');
        if (calcBtn) calcBtn.focus();
      }
    }
  });
}

/**
 * calculateRetirement - main calculation, no minus sign on negative
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
  const realRatePerMonth = (1 + rateNominalPerMonth) / (1 + rateInflationPerMonth) - 1;

  const totalNeededAfterRetire =
    (expenseAtRetire * (1 - Math.pow(1 + realRatePerMonth, -spendingPeriod * 12))) / realRatePerMonth;
  const legacyPresentValue = legacy / Math.pow(1 + rateNominalPerMonth, spendingPeriod * 12);

  const totalNeeded = totalNeededAfterRetire + legacyPresentValue;

  // Future value of current savings
  const totalSavings = cSavings * Math.pow(1 + annReturnBefore, savingsPeriod);

  // Need or Surplus
  let needOrSurplus = totalNeeded - totalSavings;

  // Monthly saving
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

  // Display results
  document.getElementById('spendingPeriodDisplay').textContent =
    spendingPeriod.toLocaleString();
  document.getElementById('totalMoneyNeededAfterRetire').textContent =
    totalNeededAfterRetire.toLocaleString(undefined, { minimumFractionDigits: 2 });
  document.getElementById('legacyPresentValue').textContent =
    legacyPresentValue.toLocaleString(undefined, { minimumFractionDigits: 2 });
  document.getElementById('totalMoneyNeeded').textContent =
    totalNeeded.toLocaleString(undefined, { minimumFractionDigits: 2 });
  document.getElementById('totalSavings').textContent =
    totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2 });

  // Remove minus sign if negative
  const absNeedOrSurplus = (needOrSurplus < 0) ? Math.abs(needOrSurplus) : needOrSurplus;
  document.getElementById('needOrSurplus').textContent =
    absNeedOrSurplus.toLocaleString(undefined, { minimumFractionDigits: 2 });

  document.getElementById('monthlySaving').textContent =
    monthlySaving.toLocaleString(undefined, { minimumFractionDigits: 2 });

  // Colorเงินขาด
  const needSurpEl = document.getElementById('needOrSurplus');
  if (needOrSurplus > 0) {
    needSurpEl.style.color = 'red';   // positive => red
  } else if (needOrSurplus < 0) {
    needSurpEl.style.color = 'green'; // negative => green
  } else {
    needSurpEl.style.color = '#333';
  }

  // Show results
  document.getElementById('inputPage').style.display = 'none';
  document.getElementById('resultsPage').classList.remove('hidden');
}

/**
 * goBackToForm - "แก้ไข"
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
 * resetForm - "เริ่มใหม่"
 */
function resetForm() {
  const numberInputs = document.querySelectorAll('input[data-type="number"]');
  numberInputs.forEach(inp => {
    inp.value = '0';
  });

  // Reset progress bar
  document.getElementById('formProgress').style.width = '0%';

  // Reset timeline
  document.getElementById('savingsPeriod').textContent = '0';
  document.getElementById('spendingPeriod').textContent = '0';

  // Reset results
  document.getElementById('spendingPeriodDisplay').textContent = '0';
  document.getElementById('totalMoneyNeededAfterRetire').textContent = '0.00';
  document.getElementById('legacyPresentValue').textContent = '0.00';
  document.getElementById('totalMoneyNeeded').textContent = '0.00';
  document.getElementById('totalSavings').textContent = '0.00';
  document.getElementById('needOrSurplus').textContent = '0.00';
  document.getElementById('monthlySaving').textContent = '0.00';

  // Fade out results, show form
  document.getElementById('resultsPage').classList.add('fade-out');
  setTimeout(() => {
    document.getElementById('resultsPage').classList.add('hidden');
    document.getElementById('inputPage').style.display = 'block';
    document.getElementById('resultsPage').classList.remove('fade-out');
  }, 500);
}

/**
 * attachEnterKey logic & comma events
 */
function init() {
  // All numeric fields
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

  // Real-time comma + decimal, ENTER -> next
  inputs.forEach(input => {
    addCommaEvent(input, () => {
      updateTimelineFields();
      validateInputs();
    });
  });
  inputs.forEach((input) => {
    attachEnterKey(input, inputs);
  });

  // Buttons
  document.getElementById('calculateButton').addEventListener('click', calculateRetirement);
  document.getElementById('editButton').addEventListener('click', goBackToForm);
  document.getElementById('restartButton').addEventListener('click', resetForm);
}

document.addEventListener('DOMContentLoaded', init);
