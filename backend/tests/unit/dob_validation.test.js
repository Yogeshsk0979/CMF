import test from 'node:test';
import assert from 'node:assert/strict';

function calculateAge(dobString, now = new Date()) {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return null;
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function validateApplicationDetails(data) {
  const errors = [];
  if (data.dob) {
    const age = calculateAge(data.dob);
    if (age !== null && age < 18) {
      errors.push('Applicant must be at least 18 years old');
    }
  }
  if (data.gender === 'female' && data.marital_status === 'married') {
    const husbandName = data.husband_name || data.spouse_name;
    const husbandPhone = data.husband_phone || data.husband_mobile;
    if (!husbandName || !husbandName.trim()) {
      errors.push("Husband's name is mandatory for married female applicants");
    }
    if (!husbandPhone || !husbandPhone.trim()) {
      errors.push("Husband's mobile number is mandatory for married female applicants");
    }
  }
  return errors;
}

test('DOB Age Calculation - Under 18 years old', () => {
  const referenceDate = new Date('2026-10-05');
  const dobUnderage = '2010-05-15';
  const age = calculateAge(dobUnderage, referenceDate);
  assert.equal(age, 16);
  assert.ok(age < 18, 'Applicant should be recognized as under 18');
});

test('DOB Age Calculation - Exactly 18 years old today', () => {
  const referenceDate = new Date('2026-10-05');
  const dob18 = '2008-10-05';
  const age = calculateAge(dob18, referenceDate);
  assert.equal(age, 18);
  assert.ok(age >= 18, 'Applicant turning 18 today should be valid');
});

test('Female Married Validation - Missing Husband Name & Mobile', () => {
  const errors = validateApplicationDetails({
    gender: 'female',
    marital_status: 'married',
    husband_name: '',
    husband_phone: ''
  });
  assert.equal(errors.length, 2);
  assert.equal(errors[0], "Husband's name is mandatory for married female applicants");
  assert.equal(errors[1], "Husband's mobile number is mandatory for married female applicants");
});

test('Female Married Validation - Valid Husband Name & Mobile Provided', () => {
  const errors = validateApplicationDetails({
    gender: 'female',
    marital_status: 'married',
    husband_name: 'Rajesh Kumar',
    husband_phone: '9876543210'
  });
  assert.equal(errors.length, 0);
});

test('Female Single Validation - No Husband Details Needed', () => {
  const errors = validateApplicationDetails({
    gender: 'female',
    marital_status: 'single'
  });
  assert.equal(errors.length, 0);
});

test('Male Married Validation - Husband Details Not Mandatory', () => {
  const errors = validateApplicationDetails({
    gender: 'male',
    marital_status: 'married'
  });
  assert.equal(errors.length, 0);
});
