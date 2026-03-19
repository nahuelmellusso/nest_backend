import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

export function IsDateRangeValid(
  startField: string,
  endField: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isDateRangeValid",
      target: object.constructor,
      propertyName,
      constraints: [startField, endField],
      options: validationOptions,
      validator: {
        validate(_: any, args: ValidationArguments) {
          const [startFieldName, endFieldName] = args.constraints;
          const obj = args.object as Record<string, any>;

          if (!obj[startFieldName] || !obj[endFieldName]) {
            return true;
          }

          const start = new Date(obj[startFieldName]);
          const end = new Date(obj[endFieldName]);

          return end >= start;
        },
      },
    });
  };
}
