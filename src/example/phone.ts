import * as graphql from 'graphql';
import { Property, TransformOnCreate, Validate, DefaultOnOutput } from 'dryerjs';

export class Phone {
    @Property()
    @Validate((phoneNumber: string) => {
        if (phoneNumber.length >= 9) return;
        throw new graphql.GraphQLError(`Invalid phoneNumber ${phoneNumber}`, {
            extensions: {
                code: 'BAD_REQUEST',
                http: { status: 400 },
            },
        });
    })
    @TransformOnCreate((phoneNumber: string) => {
        if (phoneNumber.startsWith('0')) return phoneNumber;
        return `0${phoneNumber}`;
    })
    phoneNumber: string;

    @Property()
    @DefaultOnOutput(() => '+1')
    countryPrefix: string;
}
