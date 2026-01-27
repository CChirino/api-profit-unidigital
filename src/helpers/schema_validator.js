import Ajv from "ajv"
import addFormats from "ajv-formats"
import { hka_schema } from "../schemas/hka_schema.js"

const ajv = new Ajv({allErrors: true, strictTypes: false, strictTuples: false, strictRequired: false, strict: false });
addFormats(ajv);

ajv.addFormat('date', {
    type: 'string',
    validate: function (dateString) {
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      if (!dateRegex.test(dateString)) {
        return false;
      }
      const [_, day, month, year] = dateRegex.exec(dateString);
      const date = new Date(`${year}-${month}-${day}`);
      return date.getUTCDate() == day && date.getUTCMonth() + 1 == month && date.getUTCFullYear() == year;
    },
  });

ajv.addFormat('time', {
type: 'string',
validate: function (timeString) {
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]:[0-5][0-9] (am|pm)$/i;
    return timeRegex.test(timeString);
},
});

export const validate_hka = async (hka_json) => {
    const validate = ajv.compile(hka_schema)
    const valid = validate(hka_json)
    const return_value = {valido: valid, errors: validate.errors}
    return return_value;
}