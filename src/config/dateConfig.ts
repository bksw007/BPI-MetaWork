// Date Configuration - dd-mm-yyyy format
export const DATE_FORMAT = 'dd-mm-yyyy' as const;

// Date validation regex for dd-mm-yyyy
export const DATE_REGEX = /^(\d{2})-(\d{2})-(\d{4})$/;

// Format date to dd-mm-yyyy string
export const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Parse dd-mm-yyyy string to Date object
export const parseDate = (dateString: string): Date | null => {
  if (!DATE_REGEX.test(dateString)) {
    return null;
  }
  
  const [, day, month, year] = dateString.match(DATE_REGEX) || [];
  const date = new Date(`${year}-${month}-${day}`);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
};

// Validate dd-mm-yyyy format
export const isValidDateFormat = (dateString: string): boolean => {
  if (!DATE_REGEX.test(dateString)) {
    return false;
  }
  
  const parsed = parseDate(dateString);
  return parsed !== null;
};

// Get today's date in dd-mm-yyyy format
export const getTodayDate = (): string => {
  return formatDate(new Date());
};

// Date format examples for documentation
export const DATE_EXAMPLES = {
  VALID: ['21-01-2024', '15-12-2023', '01-03-2024'],
  INVALID: ['2024-01-21', '21/01/2024', '21-1-2024', '32-01-2024'],
  CSV_HEADER: 'Date',
  CSV_EXAMPLES: [
    '21-01-2024,SH001,AIR,Product A,100,50,10,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,Test record'
  ]
};

export default {
  DATE_FORMAT,
  DATE_REGEX,
  formatDate,
  parseDate,
  isValidDateFormat,
  getTodayDate,
  DATE_EXAMPLES
};
