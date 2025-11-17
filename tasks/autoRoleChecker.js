// tasks/autoRoleChecker.js
const db = require('../db-manager.js');

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MS_PER_HOUR = 1000 * 60 * 60;

/**
 * Checks all auto-role rules for all members in all guilds.
 * This is a heavy task and should not be run too frequently.
 * @param {Client} client
 */
async function checkAutoRoles(client) {
    const allRules = db.getAllAutoRoles();
    if (allRules.length === 0) return; // Nichts zu tun

    console.log(`[AutoRoles] Checking ${allRules.length} rules...`);

    // Wir gruppieren die Regeln nach Gilde, um API-Aufrufe zu bündeln
    const rulesByGuild = {};
    for (const rule of allRules) {
        if (!rulesByGuild[rule.guild_id]) {
            rulesByGuild[rule.guild_id] = [];
        }
        rulesByGuild[rule.guild_id].push(rule);
    }

    for (const guildId in rulesByGuild) {
        const rules = rulesByGuild[guildId];
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
            console.warn(`[AutoRoles] Guild ${guildId} not found, skipping.`);
            continue;
        }

        // Wir holen alle Mitglieder dieser Gilde
        let members;
        try {
            members = await guild.members.fetch();
        } catch (err) {
            console.error(`[AutoRoles] Could not fetch members for guild ${guild.id}: ${err.message}`);
            continue; // Nächste Gilde
        }
        
        for (const member of members.values()) {
            if (member.user.bot) continue; // Ignoriere Bots

            const userData = db.getUserData(guild.id, member.id);
            
            for (const rule of rules) {
                const hasRole = member.roles.cache.has(rule.role_id);
                let criteriaMet = false;

                // Prüfe die Kriterien
                switch (rule.parameter_type) {
                    case 'LEVEL':
                        criteriaMet = (userData.level >= rule.required_value);
                        break;
                    case 'MESSAGE_COUNT':
                        criteriaMet = (userData.achievementCounters.messageCount >= rule.required_value);
                        break;
                    case 'JOIN_AGE_DAYS':
                        const joinAgeMs = Date.now() - member.joinedTimestamp;
                        const joinAgeDays = Math.floor(joinAgeMs / MS_PER_DAY);
                        criteriaMet = (joinAgeDays >= rule.required_value);
                        break;
                    case 'VC_TIME_HOURS':
                        const vcTimeHours = Math.floor(userData.achievementCounters.totalVcTime / MS_PER_HOUR);
                        criteriaMet = (vcTimeHours >= rule.required_value);
                        break;
                }

                // Wende die Rolle an (oder entferne sie, falls wir das später wollen)
                if (criteriaMet && !hasRole) {
                    try {
                        await member.roles.add(rule.role_id);
                        console.log(`[AutoRoles] Role ${rule.role_id} added to ${member.user.tag} in ${guild.name}.`);
                    } catch (e) {
                        console.warn(`[AutoRoles] Failed to add role ${rule.role_id} to ${member.user.tag}: ${e.message}`);
                    }
                }
            }
        }
    }
    console.log("[AutoRoles] Check complete.");
}

module.exports = { checkAutoRoles };