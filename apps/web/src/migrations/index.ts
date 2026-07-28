import * as migration_20260727_054408_p1_editorial_foundation from './20260727_054408_p1_editorial_foundation';
import * as migration_20260727_183217_production_public_product_closure from './20260727_183217_production_public_product_closure';
import * as migration_20260727_190700_places_editorial_nodes from './20260727_190700_places_editorial_nodes';
import * as migration_20260727_191417_homepage_and_spotlight_controls from './20260727_191417_homepage_and_spotlight_controls';
import * as migration_20260727_193832 from './20260727_193832';

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
    name: '20260727_193832'
  },
];
