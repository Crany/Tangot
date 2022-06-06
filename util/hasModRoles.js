const modRoles = require('../data/modRoles.json').modRoles;

/**
 * 
 * @param {String} input Either an "Message" input or "Interaction" input.
 * @param {Object} type "i" = Interacton | "m" = Message
 * @returns 
 */

// It's async so don't forget to use await

module.exports = {
    has(type, input) {
        if (type == "m") {
            return modRoles.some(roles => { // Checks if the message author has any Moderation roles //
                if (input.channel.type != 'DM') return input.member.roles.cache.has(roles);
            })
        } else if (type == "i") {
            return modRoles.some(roles => {
                return input.member.roles.cache.has(roles);
            })
        } else {
            return false;
        }
    },
    roles: modRoles
}