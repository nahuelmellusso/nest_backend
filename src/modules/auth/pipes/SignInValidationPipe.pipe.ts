import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class SignInValidationPipe implements PipeTransform<any> {
    async transform(value: any, { metatype }: ArgumentMetadata) {
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }
        const object = plainToInstance(metatype, value);
        const errors = await validate(object);
        if (errors.length > 0) {
            const errorMessages = this.buildError(errors);
            throw new BadRequestException({ message: 'Validation failed', errors: errorMessages,status:422} );
        }
        return value;
    }

    private toValidate(metatype: Function): boolean {
        const types: Function[] = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
    }

    private buildError(errors: any[]) {
        const result = {};
        errors.forEach(err => {
            const property = err.property;
            Object.entries(err.constraints).forEach(([key, value]) => {
                if (!result[property]) {
                    result[property] = [];
                }
                result[property].push(value);
            });
        });
        return result;
    }
}
