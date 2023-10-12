import { ExcludeOnInput, Property, DefaultOnOutput } from 'dryerjs';

export class Address {
    @ExcludeOnInput()
    @Property()
    id: string;

    @Property()
    streetAddress: string;

    @Property()
    @DefaultOnOutput(() => '000')
    postalCode: string;
}
