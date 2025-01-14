// Utility Functions

/**
 * Formats a number with commas as thousands separators.
 * @param {string} value - The numeric string to format.
 * @returns {string} - The formatted string with commas.
 */
function formatNumberWithCommas(value) {
  // Remove all non-digit characters
  const numericValue = value.replace(/[^0-9]/g, '');
  if (numericValue === '') return '0';
  // Add commas
  return parseInt(numericValue, 10).toLocaleString();
}

/**
 * Removes commas from a formatted number string.
 * @param {string} value - The formatted string with commas.
 * @returns {number} - The numeric value.
 */
function unformatNumber(value) {
  return parseFloat(value.replace(/,/g, '')) || 0;
}

/**
 * Clears the input field if the current value is '0'.
 * @param {HTMLInputElement} input - The input element.
 */
function clearDefaultValue(input) {
  if (input.value === '0') {
    input.value = '';
  }
}

/**
 * Formats the input field's value with commas.
 * @param {HTMLInputElement} input - The input element.
 */
function formatInputValue(input) {
  const formattedValue = formatNumberWithCommas(input.value);
  input.value = formattedValue;
}

/**
 * Validates that the input contains only numeric characters and commas.
 * @param {string} value - The input value.
 * @returns {boolean} - True if valid, false otherwise.
 */
function isValidNumber(value) {
  return /^[0-9,]*$/.test(value);
}

/**
 * Updates the progress bar based on filled fields.
 */
function updateProgressBar() {
  const totalFields = document.querySelectorAll("input[data-type='number']").length;
  const filledFields = Array.from(document.querySelectorAll("input[data-type='number']")).filter(input => unformatNumber(input.value) > 0).length;
  const progressPercentage = Math.round((filledFields / totalFields) * 100);
  document.getElementById("formProgress").style.width = `${progressPercentage}%`;
}

/**
 * Updates calculated fields: Savings Period and Spending Period.
 */
function updateCalculatedFields() {
  const currentAge = unformatNumber(document.getElementById("currentAge").value);
  const retireAge = unformatNumber(document.getElementById("retireAge").value);
  const deathAge = unformatNumber(document.getElementById("deathAge").value);

  const savingsPeriod = retireAge - currentAge;
  const spendingPeriod = deathAge - retireAge;

  // Ensure non-negative values
  const displaySavingsPeriod = savingsPeriod >= 0 ? savingsPeriod : 0;
  const displaySpendingPeriod = spendingPeriod >= 0 ? spendingPeriod : 0;

  document.getElementById("savingsPeriod").textContent = displaySavingsPeriod;
  document.getElementById("spendingPeriod").textContent = displaySpendingPeriod;
}

/**
 * Validates inputs and shows error messages.
 * @returns {boolean} - True if all inputs are valid, false otherwise.
 */
function validateInputs() {
  const currentAge = unformatNumber(document.getElementById("currentAge").value);
  const retireAge = unformatNumber(document.getElementById("retireAge").value);
  const deathAge = unformatNumber(document.getElementById("deathAge").value);

  let valid = true;

  // Validate Current Age
  if (currentAge <= 0) {
    showError("currentAgeError", "กรุณาใส่อายุที่ถูกต้อง!");
    valid = false;
  } else {
    hideError("currentAgeError");
  }

  // Validate Retirement Age
  if (retireAge <= currentAge) {
    showError("retireAgeError", "อายุเกษียณต้องมากกว่าอายุปัจจุบัน!");
    valid = false;
  } else {
    hideError("retireAgeError");
  }

  // Validate Death Age
  if (deathAge <= retireAge) {
    showError("deathAgeError", "อายุขัยต้องมากกว่าอายุเกษียณ!");
    valid = false;
  } else {
    hideError("deathAgeError");
  }

  updateProgressBar();

  return valid;
}

/**
 * Shows an error message for a specific input field.
 * @param {string} errorId - The ID of the error message element.
 * @param {string} message - The error message to display.
 */
function showError(errorId, message) {
  const errorElement = document.getElementById(errorId);
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

/**
 * Hides an error message for a specific input field.
 * @param {string} errorId - The ID of the error message element.
 */
function hideError(errorId) {
  const errorElement = document.getElementById(errorId);
  errorElement.textContent = "";
  errorElement.style.display = "none";
}

/**
 * Updates milestone completion indicators.
 */
function updateMilestoneStatus() {
  const milestones = [
    { id: "currentAge", element: document.querySelector('.milestone:nth-child(1)') },
    { id: "retireAge", element: document.querySelector('.milestone:nth-child(3)') },
    { id: "deathAge", element: document.querySelector('.milestone:nth-child(5)') }
  ];

  milestones.forEach(milestone => {
    const value = unformatNumber(document.getElementById(milestone.id).value);
    if (value > 0) {
      milestone.element.classList.add("completed");
    } else {
      milestone.element.classList.remove("completed");
    }
  });
}

/**
 * Handles input formatting, validation, and progress updates.
 */
function handleInputEvents(input) {
  // Prevent invalid characters on keypress
  input.addEventListener("keypress", (e) => {
    const char = String.fromCharCode(e.which);
    if (!/[0-9]/.test(char)) {
      e.preventDefault();
    }
  });

  // Clear default value on focus
  input.addEventListener("focus", () => {
    clearDefaultValue(input);
  });

  // Format input and validate on input
  input.addEventListener("input", () => {
    if (isValidNumber(input.value)) {
      formatInputValue(input);
      updateCalculatedFields();
      validateInputs();
      updateMilestoneStatus();
    } else {
      // Remove invalid characters
      input.value = input.value.replace(/[^0-9,]/g, '');
    }
  });

  // Ensure proper formatting on blur
  input.addEventListener("blur", () => {
    if (input.value === '') {
      input.value = '0';
    } else {
      formatInputValue(input);
    }
  });
}

/**
 * Attaches event listeners to all number inputs.
 */
function attachEventListeners() {
  const numberInputs = document.querySelectorAll("input[data-type='number']");
  numberInputs.forEach(input => {
    handleInputEvents(input);
  });
}

/**
 * Performs the retirement calculations and displays the results.
 */
function calculateRetirement() {
  // Perform input validation
  if (!validateInputs()) {
    return;
  }

  // Retrieve inputs
  const currentAge = unformatNumber(document.getElementById("currentAge").value);
  const retireAge = unformatNumber(document.getElementById("retireAge").value);
  const deathAge = unformatNumber(document.getElementById("deathAge").value);
  const savingsPeriod = retireAge - currentAge;
  const spendingPeriod = deathAge - retireAge;

  const currentSalary = unformatNumber(document.getElementById("currentSalary").value);
  const currentExpense = unformatNumber(document.getElementById("currentExpense").value);
  const currentSavings = unformatNumber(document.getElementById("currentSavings").value);
  const annualReturnBeforeRetire = unformatNumber(document.getElementById("annualReturn").value) / 100;
  const inflationRate = unformatNumber(document.getElementById("inflationRate").value) / 100;
  const legacy = unformatNumber(document.getElementById("legacy").value);
  const annualReturnAfterRetire = unformatNumber(document.getElementById("postRetirementReturn").value) / 100;

  // Step 1: Durations
  const yearsToSave = savingsPeriod; // มีเวลาเก็บเงิน
  const yearsToUse = spendingPeriod; // ถึงเวลาใช้เงินที่เก็บ

  // Step 2: Current Expense Per Month at Retirement
  const currentExpenseAtRetirement = currentExpense * 0.7 * Math.pow(1 + inflationRate, yearsToSave);

  // Step 3: Rate Nominal and Inflation Per Month
  const rateNominalPerMonth = Math.pow(1 + annualReturnAfterRetire, 1 / 12) - 1;
  const rateInflationPerMonth = Math.pow(1 + inflationRate, 1 / 12) - 1;

  // Step 4: Real Rate Return (Monthly)
  const realRatePerMonth = (1 + rateNominalPerMonth) / (1 + rateInflationPerMonth) - 1;

  // Step 5: Total Money Needed After Retirement (PV of Expenses During Retirement)
  const totalMoneyNeededAfterRetire =
    (currentExpenseAtRetirement * (1 - Math.pow(1 + realRatePerMonth, -yearsToUse * 12))) / realRatePerMonth;

  // Step 6: Legacy (PV Formula)
  const legacyPresentValue = legacy / Math.pow(1 + rateNominalPerMonth, yearsToUse * 12);

  // Step 7: Total Money Needed After Retirement Including Legacy
  const totalMoneyNeeded = totalMoneyNeededAfterRetire + legacyPresentValue;

  // Step 8: Total Savings at Retirement (FV Formula for Current Savings)
  const totalSavings = currentSavings * Math.pow(1 + annualReturnBeforeRetire, yearsToSave);

  // Step 9: Need/Surplus
  const needOrSurplus = totalMoneyNeeded - totalSavings;

  // Step 10: Monthly Saving Required (PMT Formula)
  let monthlySaving = 0;
  if (needOrSurplus > 0) {
    const monthlyRate = annualReturnBeforeRetire / 12; // Monthly rate from annual return
    const periods = yearsToSave * 12; // Total number of months for saving
    const denominator = Math.pow(1 + monthlyRate, periods) - 1;
    if (denominator !== 0) {
      monthlySaving = (needOrSurplus * monthlyRate) / denominator;
      monthlySaving = isFinite(monthlySaving) ? monthlySaving : 0; // Handle division by zero
    } else {
      // If interest rate is 0
      monthlySaving = needOrSurplus / periods;
    }
  }

  // Step 11: Display Results
  document.getElementById("spendingPeriodDisplay").textContent = yearsToUse;
  document.getElementById("totalMoneyNeededAfterRetire").textContent = '฿' + totalMoneyNeededAfterRetire.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById("legacyPresentValue").textContent = '฿' + legacyPresentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById("totalMoneyNeeded").textContent = '฿' + totalMoneyNeeded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById("totalSavings").textContent = '฿' + totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById("needOrSurplus").textContent = '฿' + needOrSurplus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById("monthlySaving").textContent = '฿' + monthlySaving.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Update Progress Bar to 100%
  document.getElementById("formProgress").style.width = `100%`;

  // Toggle visibility with animation
  document.getElementById("retirementForm").classList.add("fade-out");
  setTimeout(() => {
    document.getElementById("inputPage").style.display = "none";
    document.getElementById("resultsPage").classList.remove("hidden");
    document.getElementById("resultsPage").classList.add("fade-in");
  }, 500);
}

/**
 * Resets the form and navigates back to the input section.
 */
function resetForm() {
  // Reset form fields
  const numberInputs = document.querySelectorAll("input[data-type='number']");
  numberInputs.forEach(input => {
    input.value = '0';
  });

  // Reset calculated fields
  document.getElementById("savingsPeriod").textContent = '0';
  document.getElementById("spendingPeriod").textContent = '0';

  // Reset results fields
  document.getElementById("spendingPeriodDisplay").textContent = '0';
  document.getElementById("totalMoneyNeededAfterRetire").textContent = '฿0.00';
  document.getElementById("legacyPresentValue").textContent = '฿0.00';
  document.getElementById("totalMoneyNeeded").textContent = '฿0.00';
  document.getElementById("totalSavings").textContent = '฿0.00';
  document.getElementById("needOrSurplus").textContent = '฿0.00';
  document.getElementById("monthlySaving").textContent = '฿0.00';

  // Hide results and show form with animation
  document.getElementById("resultsPage").classList.add("fade-out");
  setTimeout(() => {
    document.getElementById("resultsPage").classList.add("hidden");
    document.getElementById("inputPage").style.display = "block";
    document.getElementById("inputPage").classList.remove("fade-out");
    document.getElementById("inputPage").classList.add("fade-in");
    // Reset progress bar
    document.getElementById("formProgress").style.width = `0%`;
  }, 500);
}

/**
 * Initializes the application.
 */
function init() {
  attachEventListeners();

  // Calculate Button Event Listener
  document.getElementById("calculateButton").addEventListener("click", calculateRetirement);

  // Back Button Event Listener
  document.getElementById("backButton").addEventListener("click", resetForm);
}

// Initialize the application on DOMContentLoaded
document.addEventListener("DOMContentLoaded", init);
