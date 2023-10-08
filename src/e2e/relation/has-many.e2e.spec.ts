import {
    BelongsTo,
    ExcludeOnInput,
    ExcludeOnUpdate,
    HasMany,
    NullableOnOutput,
    Property,
    Ref,
    RequiredOnCreate,
} from 'dryerjs';
import { DryerTest } from '../dryer-test';

class AttributeValue {
    @ExcludeOnInput()
    @Property()
    id: string;

    @Property()
    @RequiredOnCreate()
    code: string;

    @BelongsTo({ type: () => Attribute, from: 'attributeId' })
    @NullableOnOutput()
    attribute: Ref<Attribute>;

    @ExcludeOnUpdate()
    @RequiredOnCreate()
    @Property()
    attributeId: string;
}

class Attribute {
    @ExcludeOnInput()
    @Property()
    id: string;

    @Property()
    code: string;

    @HasMany({ type: AttributeValue, to: 'attributeId' })
    @NullableOnOutput()
    attributeValues: AttributeValue[];
}

export const dryer = DryerTest.init({
    modelDefinitions: [Attribute, AttributeValue],
});

describe('Belongs and HasMany works', () => {
    beforeAll(async () => {
        await dryer.start();
    });

    describe('Example app works', () => {
        beforeAll(async () => {
            const attributes = [
                {
                    code: 'COLOR',
                    values: ['RED', 'GREEN'],
                },
                {
                    code: 'GENDER',
                    values: ['MALE', 'FEMALE'],
                },
            ];
            for (const attribute of attributes) {
                const {
                    createAttribute: { id: attributeId },
                } = await dryer.makeSuccessRequest({
                    query: `
                        mutation CreateAttribute($input: CreateAttributeInput!) {
                            createAttribute(input: $input) {
                                id
                            }
                        }
                    `,
                    variables: { input: { code: attribute.code } },
                });
                for (const value of attribute.values) {
                    await dryer.makeSuccessRequest({
                        query: `
                            mutation CreateAttributeValue($input: CreateAttributeValueInput!) {
                                createAttributeValue(input: $input) {
                                    id
                                }
                            }
                        `,
                        variables: { input: { code: value, attributeId } },
                    });
                }
            }
        });

        it('should return all attribute values', async () => {
            const { allAttributeValues } = await dryer.makeSuccessRequest({
                query: `
                    query AllAttributeValues {
                        allAttributeValues {
                            code
                            attribute {
                                code
                            }
                        }
                    }
                `,
            });
            expect(allAttributeValues).toEqual([
                { code: 'RED', attribute: { code: 'COLOR' } },
                { code: 'GREEN', attribute: { code: 'COLOR' } },
                { code: 'MALE', attribute: { code: 'GENDER' } },
                { code: 'FEMALE', attribute: { code: 'GENDER' } },
            ]);
        });

        it('should return all attributes', async () => {
            const { allAttributes } = await dryer.makeSuccessRequest({
                query: `
                    query AllAttributes {
                        allAttributes {
                            code
                            attributeValues {
                                code
                                attribute {
                                    code
                                    attributeValues {
                                        code
                                    }
                                }
                            }
                        }
                    }
                `,
            });

            expect(allAttributes).toEqual([
                {
                    code: 'COLOR',
                    attributeValues: [
                        {
                            code: 'RED',
                            attribute: {
                                code: 'COLOR',
                                attributeValues: [
                                    {
                                        code: 'RED',
                                    },
                                    {
                                        code: 'GREEN',
                                    },
                                ],
                            },
                        },
                        {
                            code: 'GREEN',
                            attribute: {
                                code: 'COLOR',
                                attributeValues: [
                                    {
                                        code: 'RED',
                                    },
                                    {
                                        code: 'GREEN',
                                    },
                                ],
                            },
                        },
                    ],
                },
                {
                    code: 'GENDER',
                    attributeValues: [
                        {
                            code: 'MALE',
                            attribute: {
                                code: 'GENDER',
                                attributeValues: [
                                    {
                                        code: 'MALE',
                                    },
                                    {
                                        code: 'FEMALE',
                                    },
                                ],
                            },
                        },
                        {
                            code: 'FEMALE',
                            attribute: {
                                code: 'GENDER',
                                attributeValues: [
                                    {
                                        code: 'MALE',
                                    },
                                    {
                                        code: 'FEMALE',
                                    },
                                ],
                            },
                        },
                    ],
                },
            ]);
        });
    });

    afterAll(async () => {
        await dryer.stop();
    });
});
