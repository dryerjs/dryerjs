import {
    BelongsTo,
    ExcludeOnCreate,
    ExcludeOnUpdate,
    HasMany,
    NullableOnOutput,
    Property,
    Ref,
    RequiredOnCreate,
} from 'dryerjs';
import * as util from '../../util';
import { DryerTest } from '../dryer-test';

class Leaf {
    @ExcludeOnCreate()
    @Property()
    id: string;

    @Property()
    name: string;

    @BelongsTo({ type: () => Branch, from: 'branchId' })
    @NullableOnOutput()
    branch: Ref<Branch>;

    @ExcludeOnUpdate()
    @RequiredOnCreate()
    @Property()
    branchId: string;
}

class Branch {
    @ExcludeOnCreate()
    @Property()
    id: string;

    @Property()
    name: string;

    @HasMany({ type: Leaf, to: 'branchId' })
    @NullableOnOutput()
    leaves: Leaf[];

    @BelongsTo({ type: () => Trunk, from: 'trunkId' })
    @NullableOnOutput()
    trunk: Ref<Trunk>;

    @ExcludeOnUpdate()
    @RequiredOnCreate()
    @Property()
    trunkId: string;
}

class Trunk {
    @ExcludeOnCreate()
    @Property()
    id: string;

    @Property()
    name: string;

    @HasMany({ type: Branch, to: 'trunkId' })
    @NullableOnOutput()
    branches: Branch[];
}

export const dryer = DryerTest.init({
    modelDefinitions: [Leaf, Branch, Trunk],
});

describe('Belongs and HasMany works', () => {
    beforeAll(async () => {
        await dryer.start();
    });

    it('Create works with 3 layers', async () => {
        const input = {
            name: 'trunk 1',
            branches: [
                {
                    name: 'branch 1',
                    leaves: [
                        {
                            name: 'leaf 1',
                        },
                    ],
                },
                {
                    name: 'branch 2',
                    leaves: [
                        {
                            name: 'leaf 2',
                        },
                        {
                            name: 'leaf 3',
                        },
                    ],
                },
            ],
        };

        const { createTrunk: trunk } = await dryer.makeSuccessRequest({
            query: `
                mutation CreateTrunk($input: CreateTrunkInput!) {
                    createTrunk(input: $input) {
                        id
                        name
                        branches {
                            id
                            name
                            trunk {
                                id
                            }
                            leaves {
                                name
                                branch {
                                    id
                                    trunk {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            `,
            variables: { input },
        });

        expect(util.deepOmit(trunk, ['id', 'trunk', 'branch'])).toEqual(input);
        expect(trunk.branches[0].leaves[0].branch.trunk.id).toEqual(trunk.id);
    });

    afterAll(async () => {
        await dryer.stop();
    });
});
