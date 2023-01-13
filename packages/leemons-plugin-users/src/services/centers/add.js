const existName = require('./existName');
const { translations } = require('../translations');
const { table } = require('../tables');
const createNecessaryRolesForProfilesAccordingToCenters = require('../profiles/createNecessaryRolesForProfilesAccordingToCenters');

/**
 * Create one center
 * @private
 * @static
 * @param {CenterAdd} data
 * @param {any=} _transacting -  DB Transaction
 * @return {Promise<Center>} Created / Updated role
 * */
async function add({ id, name, locale, ...centerData }, { transacting: _transacting } = {}) {
  return global.utils.withTransaction(
    async (transacting) => {
      if (await existName(name, { transacting }))
        throw new Error(`Center with name '${name}' already exists`);

      if (translations()) {
        if (!(await translations().locales.has(locale.value, { transacting }))) {
          throw new Error(`The locale '${locale}' not exists`);
        }
      }

      let center = null;
      locale = locale.value;
      
      Object.keys(centerData).forEach(key => {
        if (centerData[key] != null && centerData[key].value)
        centerData[key] = centerData[key].value
      });
      if (id) {
        leemons.log.info(`Updating center '${name}'`);
        center = await table.centers.update(
          { id },
          {
            ...centerData,
            name,
            locale,
            uri: global.utils.slugify(name, { lower: true }),
          },
          { transacting }
        );
        leemons.events.emit('didUpdateCenter');
      } else {
        leemons.log.info(`Creating center '${name}'`);
        center = await table.centers.create(
          {
            ...centerData,
            name,
            locale,
            uri: global.utils.slugify(name, { lower: true }),
          },
          { transacting }
        );
        await createNecessaryRolesForProfilesAccordingToCenters(undefined, center.id, {
          transacting,
        });
        leemons.events.emit('didCreateCenter');
      }

      return center;
    },
    table.roles,
    _transacting
  );
}

module.exports = add;
