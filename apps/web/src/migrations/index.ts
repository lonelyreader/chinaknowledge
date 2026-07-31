import * as migration_20260727_054408_p1_editorial_foundation from './20260727_054408_p1_editorial_foundation';
import * as migration_20260727_183217_production_public_product_closure from './20260727_183217_production_public_product_closure';
import * as migration_20260727_190700_places_editorial_nodes from './20260727_190700_places_editorial_nodes';
import * as migration_20260727_191417_homepage_and_spotlight_controls from './20260727_191417_homepage_and_spotlight_controls';
import * as migration_20260727_193832 from './20260727_193832';
import * as migration_20260728_151519_member_publishing_and_editorial_curation from './20260728_151519_member_publishing_and_editorial_curation';
import * as migration_20260728_153810_member_account_pause from './20260728_153810_member_account_pause';
import * as migration_20260728_163327 from './20260728_163327';
import * as migration_20260728_171030_editorial_notifications_and_invites from './20260728_171030_editorial_notifications_and_invites';
import * as migration_20260728_172626_article_translation_identity from './20260728_172626_article_translation_identity';
import * as migration_20260729_030000_profile_localization_and_creator_workspace from './20260729_030000_profile_localization_and_creator_workspace';
import * as migration_20260729_193000_batch_rollback_barrier from './20260729_193000_batch_rollback_barrier';
import * as migration_20260730_181300 from './20260730_181300';

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
    name: '20260728_163327',
  },
  {
    up: migration_20260728_171030_editorial_notifications_and_invites.up,
    down: migration_20260728_171030_editorial_notifications_and_invites.down,
    name: '20260728_171030_editorial_notifications_and_invites',
  },
  {
    up: migration_20260728_172626_article_translation_identity.up,
    down: migration_20260728_172626_article_translation_identity.down,
    name: '20260728_172626_article_translation_identity',
  },
  {
    up: migration_20260729_030000_profile_localization_and_creator_workspace.up,
    down: migration_20260729_030000_profile_localization_and_creator_workspace.down,
    name: '20260729_030000_profile_localization_and_creator_workspace',
  },
  {
    up: migration_20260729_193000_batch_rollback_barrier.up,
    down: migration_20260729_193000_batch_rollback_barrier.down,
    name: '20260729_193000_batch_rollback_barrier',
  },
  {
    up: migration_20260730_181300.up,
    down: migration_20260730_181300.down,
    name: '20260730_181300'
  },
];
