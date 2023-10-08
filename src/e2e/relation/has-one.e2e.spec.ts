import {
    BelongsTo,
    DatabaseType,
    ExcludeOnInput,
    ExcludeOnUpdate,
    HasOne,
    NullableOnOutput,
    Property,
    Ref,
    RequiredOnCreate,
    ObjectId,
} from 'dryerjs';
import { DryerTest } from '../dryer-test';

class FacetValue {
    @ExcludeOnInput()
    @Property()
    id: string;

    @Property()
    @RequiredOnCreate()
    code: string;

    @BelongsTo({ type: () => Facet, from: 'facetId' })
    @NullableOnOutput()
    facet: Ref<Facet>;

    @ExcludeOnUpdate()
    @RequiredOnCreate()
    @Property()
    @DatabaseType(ObjectId)
    facetId: string;
}

class Facet {
    @ExcludeOnInput()
    @Property()
    id: string;

    @Property()
    code: string;

    @HasOne({ type: FacetValue, to: 'facetId' })
    @NullableOnOutput()
    defaultFacetValue: FacetValue;
}

export const dryer = DryerTest.init({
    modelDefinitions: [Facet, FacetValue],
});

describe('Belongs - HasOne works', () => {
    beforeAll(async () => {
        await dryer.start();
    });

    describe('Example app works', () => {
        beforeAll(async () => {
            const facets = [
                {
                    code: 'COLOR',
                    value: 'RED',
                },
                {
                    code: 'GENDER',
                    value: 'MALE',
                },
            ];
            for (const { code, value } of facets) {
                const {
                    createFacet: { id: facetId },
                } = await dryer.makeSuccessRequest({
                    query: `
                        mutation CreateFacet($input: CreateFacetInput!) {
                            createFacet(input: $input) {
                                id
                            }
                        }
                    `,
                    variables: { input: { code } },
                });
                await dryer.makeSuccessRequest({
                    query: `
                        mutation CreateFacetValue($input: CreateFacetValueInput!) {
                            createFacetValue(input: $input) {
                                id
                            }
                        }
                    `,
                    variables: { input: { code: value, facetId } },
                });
            }
        });

        it('should return all facet values', async () => {
            const { allFacetValues } = await dryer.makeSuccessRequest({
                query: `
                    query AllFacetValues {
                        allFacetValues {
                            code
                            facet {
                                code
                            }
                        }
                    }
                `,
            });
            expect(allFacetValues).toEqual([
                { code: 'RED', facet: { code: 'COLOR' } },
                { code: 'MALE', facet: { code: 'GENDER' } },
            ]);
        });

        it('should return all facets', async () => {
            const { allFacets } = await dryer.makeSuccessRequest({
                query: `
                    query AllFacets {
                        allFacets {
                            code
                            defaultFacetValue {
                                code
                                facet {
                                    code
                                    defaultFacetValue {
                                        code
                                    }
                                }
                            }
                        }
                    }
                `,
            });

            expect(allFacets).toEqual([
                {
                    code: 'COLOR',
                    defaultFacetValue: {
                        code: 'RED',
                        facet: {
                            code: 'COLOR',
                            defaultFacetValue: {
                                code: 'RED',
                            },
                        },
                    },
                },
                {
                    code: 'GENDER',
                    defaultFacetValue: {
                        code: 'MALE',
                        facet: {
                            code: 'GENDER',
                            defaultFacetValue: {
                                code: 'MALE',
                            },
                        },
                    },
                },
            ]);
        });
    });

    afterAll(async () => {
        await dryer.stop();
    });
});
