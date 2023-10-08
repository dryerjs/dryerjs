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
    let allTags: Tag[] = [];

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

        const response = await dryer.makeSuccessRequest({
            query: `
                    query AllTags {
                        allTags {
                            id
                            code
                        }
                    }
                `,
        });

        allTags = response.allTags;

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

    it('Add new tags when create a new product', async () => {
        const createProductQuery = `
            mutation CreateProduct($input: CreateProductInput!) {
                createProduct(input: $input) {
                    id
                    name
                    tagIds
                    tags {
                        id
                        code
                    }
                }
            }
        `;

        const { createProduct: response } = await dryer.makeSuccessRequest({
            query: createProductQuery,
            variables: {
                input: {
                    name: 'Product 2',
                    tagIds: [allTags[0].id, allTags[1].id],
                    tags: [{ code: 'YELLOW' }, { code: 'ORANGE' }],
                },
            },
        });

        expect(response.tagIds).toEqual([
            allTags[0].id,
            allTags[1].id,
            response.tags[2].id,
            response.tags[3].id,
        ]);
    });

    afterAll(async () => {
        await dryer.stop();
    });
});
