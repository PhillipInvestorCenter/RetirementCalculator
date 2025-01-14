/****************************************************
 * script.js
 ****************************************************/

/**
 * Removes commas from a string and returns a float.
 * Example: "150,000.50" -> 150000.50
 */
function unformatNumber(value) {
  return parseFloat(value.replace(/,/g, '')) || 0;
}

/**
 * Shows an error message for a given element ID.
 */
function showError(errorId, message) {
  const errorEl = document.getElementById(errorId);
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

/**
 * Hides an error message by ID.
 */
function hideError(errorId) {
  const errorEl = document.getElementById(errorId);
  if (!errorEl) return;
  errorEl.textContent = '';
  errorEl.style.display = 'none';
}

/**
 * Updates progress bar (how many numeric fields > 0).
 */
function updateProgressBar() {
  const numberInputs = document.querySelectorAll('input[data-type="number"]');
  const total = numberInputs.length;
  let filled = 0;

  numberInputs.forEach((inp) => {
    if (unformatNumber(inp.value) > 0) {
      filled++;
    }
  });

  const percent = Math.round((filled / total) * 100);
  document.getElementById('formProgress').style.width = percent + '%';
}

/**
 * Updates timeline fields (savingsPeriod, spendingPeriod).
 */
function updateTimelineFields() {
  const currentAge = unformatNumber(document.getElementById('currentAge').value);
  const retireAge = unformatNumber(document.getElementById('retireAge').value);
  const deathAge = unformatNumber(document.getElementById('deathAge').value);

  const savingsPeriod = retireAge - currentAge;
  const spendingPeriod = deathAge - retireAge;

  document.getElementById('savingsPeriod').textContent = (savingsPeriod >= 0) ? savingsPeriod : 0;
  document.getElementById('spendingPeriod').textContent = (spendingPeriod >= 0) ? spendingPeriod : 0;
}

/**
 * Example milestone logic, if you have .milestone elements.
 */
function updateMilestoneStatus() {
  const milestones = [
    { id: 'currentAge', element: document.querySelector('.milestone:nth-child(1)') },
    { id: 'retireAge', element: document.querySelector('.milestone:nth-child(3)') },
    { id: 'deathAge', element: document.querySelector('.milestone:nth-child(5)') }
  ];

  milestones.forEach(m => {
    if (!m.element) return;
    const val = unformatNumber(document.getElementById(m.id).value);
    if (val > 0) {
      m.element.classList.add('completed');
    } else {
      m.element.classList.remove('completed');
    }
  });
}

/**
 * Validates input logic (e.g. currentAge > 0, retireAge > currentAge, etc.)
 */
function validateInputs() {
  const currentAge = unformatNumber(document.getElementById('currentAge').value);
  const retireAge = unformatNumber(document.getElementById('retireAge').value);
  const deathAge = unformatNumber(document.getElementById('deathAge').value);

  let valid = true;

  if (currentAge <= 0) {
    showError('currentAgeError', 'กรุณาใส่อายุที่ถูกต้อง!');
    valid = false;
  } else {
    hideError('currentAgeError');
  }

  if (retireAge <= currentAge) {
    showError('retireAgeError', 'อายุเกษียณต้องมากกว่าอายุปัจจุบัน!');
    valid = false;
  } else {
    hideError('retireAgeError');
  }

  if (deathAge <= retireAge) {
    showError('deathAgeError', 'อายุขัยต้องมากกว่าอายุเกษียณ!');
    valid = false;
  } else {
    hideError('deathAgeError');
  }

  updateProgressBar();
  return valid;
}

/**
 * Real-time commas + decimals. 
 * Calls onAfterFormat() (e.g. for validation) after each reformat.
 */
function addCommaEvent(id, onAfterFormat) {
  const input = document.getElementById(id);
  if (!input) return;

  input.addEventListener('input', function () {
    let cursorPos = this.selectionStart;
    // Remove commas
    let raw = this.value.replace(/,/g, '');

    if (raw === '') {
      this.value = '';
      return;
    }

    // If numeric (including decimal)
    if (!isNaN(raw)) {
      let parts = raw.split('.');
      let integerPart = parts[0] || '';
      let decimalPart = parts[1];

      // Insert commas into integer part
      let formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      let formattedValue = formattedInteger;
      // If there's a decimal
      if (decimalPart !== undefined) {
        formattedValue += '.' + decimalPart;
      }
      this.value = formattedValue;

      // Adjust cursor
      let diff = this.value.length - raw.length;
      this.selectionEnd = cursorPos + diff;
    } else {
      // Non-numeric typed
      this.value =
        this.value.substring(0, cursorPos - 1) + 
        this.value.substring(cursorPos);
      this.selectionEnd = cursorPos - 1;
    }

    if (onAfterFormat && typeof onAfterFormat === 'function') {
      onAfterFormat();
    }
  });

  // Clear if "0" on focus
  input.addEventListener('focus', () => {
    if (input.value === '0') {
      input.value = '';
    }
  });

  // If empty on blur, set to "0"
  input.addEventListener('blur', () => {
    if (input.value.trim() === '') {
      input.value = '0';
    }
  });
}

/**
 * Main retirement calculation
 */
function calculateRetirement() {
  if (!validateInputs()) return;

  // Gather inputs
  const currentAge = unformatNumber(document.getElementById('currentAge').value);
  const retireAge = unformatNumber(document.getElementById('retireAge').value);
  const deathAge = unformatNumber(document.getElementById('deathAge').value);

  const currentSalary = unformatNumber(document.getElementById('currentSalary').value);
  const currentExpense = unformatNumber(document.getElementById('currentExpense').value);
  const currentSavings = unformatNumber(document.getElementById('currentSavings').value);
  const annualReturnBeforeRetire = unformatNumber(document.getElementById('annualReturn').value) / 100;
  const inflationRate = unformatNumber(document.getElementById('inflationRate').value) / 100;
  const legacy = unformatNumber(document.getElementById('legacy').value);
  const annualReturnAfterRetire = unformatNumber(document.getElementById('postRetirementReturn').value) / 100;

  // Basic calculations
  const savingsPeriod = retireAge - currentAge;
  const spendingPeriod = deathAge - retireAge;

  // For example:
  const currentExpenseAtRetirement = currentExpense * 0.7 * Math.pow(1 + inflationRate, savingsPeriod);
  const rateNominalPerMonth = Math.pow(1 + annualReturnAfterRetire, 1/12) - 1;
  const rateInflationPerMonth = Math.pow(1 + inflationRate, 1/12) - 1;
  const realRatePerMonth = (1 + rateNominalPerMonth) / (1 + rateInflationPerMonth) - 1;

  const totalMoneyNeededAfterRetire =
    (currentExpenseAtRetirement * (1 - Math.pow(1 + realRatePerMonth, -spendingPeriod * 12))) / realRatePerMonth;

  const legacyPresentValue = legacy / Math.pow(1 + rateNominalPerMonth, spendingPeriod * 12);
  const totalMoneyNeeded = totalMoneyNeededAfterRetire + legacyPresentValue;
  const totalSavings = currentSavings * Math.pow(1 + annualReturnBeforeRetire, savingsPeriod);

  let needOrSurplus = totalMoneyNeeded - totalSavings;

  // Monthly saving logic
  let monthlySaving = 0;
  if (needOrSurplus > 0) {
    const monthlyRate = annualReturnBeforeRetire / 12;
    const periods = savingsPeriod * 12;
    const denominator = Math.pow(1 + monthlyRate, periods) - 1;
    if (denominator !== 0) {
      monthlySaving = (needOrSurplus * monthlyRate) / denominator;
      monthlySaving = isFinite(monthlySaving) ? monthlySaving : 0;
    } else {
      monthlySaving = needOrSurplus / periods;
    }
  }

  // --- Display Results --- //

  // spendingPeriod
  document.getElementById('spendingPeriodDisplay').textContent =
    spendingPeriod.toLocaleString();

  // totalMoneyNeededAfterRetire
  document.getElementById('totalMoneyNeededAfterRetire').textContent =
    totalMoneyNeededAfterRetire.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // legacyPresentValue
  document.getElementById('legacyPresentValue').textContent =
    legacyPresentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // totalMoneyNeeded
  document.getElementById('totalMoneyNeeded').textContent =
    totalMoneyNeeded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // totalSavings
  document.getElementById('totalSavings').textContent =
    totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // needOrSurplus -> remove minus sign if negative
  let displayNeedOrSurplus = (needOrSurplus < 0) ? Math.abs(needOrSurplus) : needOrSurplus;
  document.getElementById('needOrSurplus').textContent =
    displayNeedOrSurplus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // monthlySaving
  document.getElementById('monthlySaving').textContent =
    monthlySaving.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // --- Color logic for needOrSurplus
  const needOrSurplusEl = document.getElementById('needOrSurplus');
  if (needOrSurplus > 0) {
    needOrSurplusEl.style.color = 'red';   // positive => red
  } else if (needOrSurplus < 0) {
    needOrSurplusEl.style.color = 'green'; // negative => green
  } else {
    needOrSurplusEl.style.color = '#333';
  }

  // Increase font size for all result fields
  const resultIds = [
    'spendingPeriodDisplay',
    'totalMoneyNeededAfterRetire',
    'legacyPresentValue',
    'totalMoneyNeeded',
    'totalSavings',
    'needOrSurplus',
    'monthlySaving'
  ];
  resultIds.forEach(id => {
    const el = document.getElementById(id);
    el.style.fontSize = '2rem'; // increased from 1.5rem to 2rem
    el.style.fontWeight = '600';
    el.style.color = el.style.color || '#333333';
  });

  // Show results
  document.getElementById('inputPage').style.display = 'none';
  document.getElementById('resultsPage').classList.remove('hidden');
}

/**
 * "แก้ไข" -> go back to input page with existing data
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
 * "เริ่มใหม่" -> reset everything to 0
 */
function resetForm() {
  const numberInputs = document.querySelectorAll('input[data-type="number"]');
  numberInputs.forEach(inp => {
    inp.value = '0';
  });

  // Reset progress
  document.getElementById('formProgress').style.width = '0%';

  // Reset timeline
  document.getElementById('savingsPeriod').textContent = '0';
  document.getElementById('spendingPeriod').textContent = '0';

  // Reset result fields
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
 * Initialize on DOM content loaded
 */
function init() {
  // Attach addCommaEvent to numeric fields
  const numericFields = [
    'currentAge',
    'retireAge',
    'deathAge',
    'currentSalary',
    'currentExpense',
    'currentSavings',
    'annualReturn',
    'inflationRate',
    'legacy',
    'postRetirementReturn'
  ];
  numericFields.forEach(id => {
    addCommaEvent(id, () => {
      updateTimelineFields();
      validateInputs();
      updateMilestoneStatus();
    });
  });

  // Hook up buttons
  document.getElementById('calculateButton').addEventListener('click', calculateRetirement);
  document.getElementById('editButton').addEventListener('click', goBackToForm);
  document.getElementById('restartButton').addEventListener('click', resetForm);
}

// Fire after DOM content loaded
document.addEventListener('DOMContentLoaded', init);
