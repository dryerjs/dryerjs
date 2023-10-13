import { ExcludeOnCreate, Property, DefaultOnOutput } from 'dryerjs';

export class Address {
    @ExcludeOnCreate()
    @Property()
    id: string;

    @Property()
    streetAddress: string;

    @Property()
    @DefaultOnOutput(() => '000')
    postalCode: string;
}
