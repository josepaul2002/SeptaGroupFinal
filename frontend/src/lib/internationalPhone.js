import {getCountries, getCountryCallingCode, parsePhoneNumberFromString} from 'libphonenumber-js/min';

const names = new Intl.DisplayNames(['en'], {type:'region'});
export const phoneCountries = getCountries().map(code => ({code, name:names.of(code), dial:getCountryCallingCode(code)})).sort((a,b)=>a.name.localeCompare(b.name));

export function normaliseEnquiryPhone(value, country='IN') {
  try {
    const parsed = parsePhoneNumberFromString(String(value || '').trim(), {defaultCountry:country, extract:false});
    return parsed?.isPossible() && !parsed.ext ? parsed.number : '';
  } catch { return ''; }
}
