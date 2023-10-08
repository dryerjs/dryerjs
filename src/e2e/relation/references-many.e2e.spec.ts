import {
    DatabaseType,
    ExcludeOnInput,
    NullableOnOutput,
    ObjectId,
    Property,
    ReferencesMany,
    RequiredOnCreate,
} from 'dryerjs';
import { DryerTest } from '../dryer-test';

class Tag {
    @ExcludeOnInput()
    @Property()
    id: string;

    @Property()
    @RequiredOnCreate()
    code: string;
}

class Product {
    @ExcludeOnInput()
    @Property()
    id: string;

    @Property()
    name: string;

    @ReferencesMany({ type: Tag, from: 'tagIds' })
    @NullableOnOutput()
    tags: Tag[];

    @Property({ type: String })
    @DatabaseType(ObjectId)
    tagIds: string[];
}

export const dryer = DryerTest.init({
    modelDefinitions: [Tag, Product],
});

describe('ReferencesMany works', () => {
    beforeAll(async () => {
        await dryer.start();
    });

    it('Example app works', async () => {
        for (const code of ['RED', 'BLUE', 'WHITE', 'BLACK']) {
            await dryer.makeSuccessRequest({
                query: `
                        mutation CreateTag($input: CreateTagInput!) {
                            createTag(input: $input) {
                                id
                                code
                            }
                        }
                    `,
                variables: {
                    input: {
                        code,
                    },
                },
            });
        }

        const { allTags } = await dryer.makeSuccessRequest({
            query: `
                    query AllTags {
                        allTags {
                            id
                            code
                        }
                    }
                `,
        });

        const createProductQuery = `
                mutation CreateProduct($input: CreateProductInput!) {
                    createProduct(input: $input) {
                        id
                        name
                        tags {
                            id
                            code
                        }
                    }
                }
            `;

        await dryer.makeSuccessRequest({
            query: createProductQuery,
            variables: {
                input: {
                    name: 'Product 1',
                    tagIds: [allTags[0].id, allTags[1].id],
                },
            },
        });

        await dryer.makeSuccessRequest({
            query: createProductQuery,
            variables: {
                input: {
                    name: 'Product 1',
                    tagIds: [allTags[0].id, allTags[2].id],
                },
            },
        });

        const { allProducts } = await dryer.makeSuccessRequest({
            query: `
                    query AllProducts {
                        allProducts {
                            name
                            tags {
                                code
                            }
                        }
                    }
                `,
        });

        expect(allProducts).toEqual([
            {
                name: 'Product 1',
                tags: [
                    {
                        code: 'RED',
                    },
                    {
                        code: 'BLUE',
                    },
                ],
            },
            {
                name: 'Product 1',
                tags: [
                    {
                        code: 'RED',
                    },
                    {
                        code: 'WHITE',
                    },
                ],
            },
        ]);
    });

    afterAll(async () => {
        await dryer.stop();
    });
});
