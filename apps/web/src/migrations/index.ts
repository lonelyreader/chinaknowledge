import * as migration_20260727_054408_p1_editorial_foundation from './20260727_054408_p1_editorial_foundation';
import * as migration_20260727_183217_production_public_product_closure from './20260727_183217_production_public_product_closure';
import * as migration_20260727_190700_places_editorial_nodes from './20260727_190700_places_editorial_nodes';
import * as migration_20260727_191417_homepage_and_spotlight_controls from './20260727_191417_homepage_and_spotlight_controls';
import * as migration_20260727_193832 from './20260727_193832';
import * as migration_20260728_151519_member_publishing_and_editorial_curation from './20260728_151519_member_publishing_and_editorial_curation';
import * as migration_20260728_153810_member_account_pause from './20260728_153810_member_account_pause';
import * as migration_20260728_163327 from './20260728_163327';

export const migrations = [
  {
    up: migration_20260727_054408_p1_editorial_foundation.up,
    down: migration_20260727_054408_p1_editorial_foundation.down,
    name: '20260727_054408_p1_editorial_foundation',
  },
  {
    up: migration_20260727_183217_production_public_product_closure.up,
    down: migration_20260727_183217_production_public_product_closure.down,
    name: '20260727_183217_production_public_product_closure',
  },
  {
    up: migration_20260727_190700_places_editorial_nodes.up,
    down: migration_20260727_190700_places_editorial_nodes.down,
    name: '20260727_190700_places_editorial_nodes',
  },
  {
    up: migration_20260727_191417_homepage_and_spotlight_controls.up,
    down: migration_20260727_191417_homepage_and_spotlight_controls.down,
    name: '20260727_191417_homepage_and_spotlight_controls',
  },
  {
    up: migration_20260727_193832.up,
    down: migration_20260727_193832.down,
    name: '20260727_193832',
  },
  {
    up: migration_20260728_151519_member_publishing_and_editorial_curation.up,
    down: migration_20260728_151519_member_publishing_and_editorial_curation.down,
    name: '20260728_151519_member_publishing_and_editorial_curation',
  },
  {
    up: migration_20260728_153810_member_account_pause.up,
    down: migration_20260728_153810_member_account_pause.down,
    name: '20260728_153810_member_account_pause',
  },
  {
    up: migration_20260728_163327.up,
    down: migration_20260728_163327.down,
    name: '20260728_163327'
  },
];
