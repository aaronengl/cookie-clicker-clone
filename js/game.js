class Building {
    constructor(name, cost, effect, upgrades, locked = true) {
        this.name = name;
        this.amount = 0;
        this.cost = cost;
        this.multiplier = 1;
        this.baseEffect = effect;
        this.specialCPS = 0;
        this.effect = 0;
        this.upgrades = upgrades;
        this.locked = locked;
    }

    buy(amount) {
        let Player = Game.Player;
        if (Player.spendCookies(this.getCost(amount)) == true) {
            this.amount += amount;
            this.cost = Math.round(this.cost * Math.pow(1.15, amount));
            Game.Settings.RecalculateCPS = true;
            let curIndex = Game.Utilities.GetBuildingIndexByName(this.name);
            if (curIndex + 1 <= Game.Buildings.length - 1) {
                let nextBuilding = Game.Buildings[curIndex + 1];
                if (nextBuilding.locked == true) {
                    nextBuilding.locked = false;
                    Game.ConstructShop();
                }
            }
        }
    }

    buyUpgrade(name) {
        let Player = Game.Player;
        this.upgrades.forEach(upgrade => {
            if (upgrade.name == name) {
                if (Player.spendCookies(upgrade.cost) == true) {
                    upgrade.owned = true;
                    Game.Settings.RecalculateCPS = true;
                    return;
                }
            }
        });
    }

    calculateEffectOfUpgrades() {
        let multiplier = 1;
        let Player = Game.Player;
        let buildingCount = Game.Utilities.GetBuildingCount();
        this.specialCPS = 0;
        if (this.name == 'Cursor') { Game.Player.AMPC = 1; }
        this.upgrades.forEach(upgrade => {
            if (upgrade.owned == true) {
                if (upgrade.special == false) {
                    multiplier *= 2;
                    if (this.name == 'Cursor') {
                        Player.AMPC *= 2;
                    }
                } else {
                    // Special casing for all special types of upgrades
                    // There may at some point be more than just cursors here, as theres special stuff for grandmas as well.
                    switch (this.name) {
                        case 'Cursor':
                            let nonCursorBuildingCount = buildingCount - this.amount;
                            this.specialCPS += (upgrade.special * nonCursorBuildingCount) * this.amount;
                            Player.AMPC += (upgrade.special * nonCursorBuildingCount);
                    }
                }
            }
        });
        return multiplier;
    }

    getCPS() {
        this.multiplier = this.calculateEffectOfUpgrades();
        this.effect = ((this.baseEffect * this.amount) * this.multiplier) + this.specialCPS;
        return this.effect;
    }

    getCost(amount) {
        let bulkCost = this.cost;
        let tempPrice = this.cost;
        for (var i = 0; i < amount - 1; i++) {
            bulkCost += Math.round(tempPrice *= 1.15);
        }
        return bulkCost;
    }

    generateMenuButton() {
        return `<button onclick="Game.UpdateShop('${this.name}');">${this.name}</button>`;
    }   

    generateBuyButtons() {
        let Format = Game.Utilities.FormatNumber;
        let HTML = '<div class="btnBuyGroup">';
        HTML += `<button onclick="Game.BuyBuilding('${this.name}', 1);">Buy x1</br><b>${Format(this.cost)}</b></button>`
        HTML += `<button onclick="Game.BuyBuilding('${this.name}', 5);">Buy x5</br><b>${Format(this.getCost(5))}</b></button>`;
        HTML += `<button onclick="Game.BuyBuilding('${this.name}', 10);">Buy x10</br><b>${Format(this.getCost(10))}</b></button>`;
        HTML += '</div>';
        return HTML;
    }

    generateUpgradeButtons() {
        let HTML = '';
        let NotMet = false;
        this.upgrades.forEach(upgrade => {
            let Format = Game.Utilities.FormatNumber;
            if (upgrade.owned == false) {
                if (upgrade.requirementMet(this.amount)) {
                    HTML += `<button class="upgBtn" onclick="Game.BuyUpgrade('${this.name}', '${upgrade.name}')"><b>${upgrade.name}</b></br>${upgrade.desc}</br><b>${Format(upgrade.cost)}</b></button>`
                } else {
                    if (NotMet == false) {
                        NotMet = true;
                        HTML += `<div class="upgNext">Next upgrade in <b>${upgrade.limit - this.amount}</b> more ${this.name.toLowerCase()}(s)</div>`;
                    }
                }
            }
        });
        return HTML;
    }

    generateShopHTML() {
        let Format = Game.Utilities.FormatNumber;
        let SingleEffect = (this.baseEffect * this.multiplier)
        if (this.specialCPS > 0) {
            SingleEffect += (this.specialCPS / this.amount);
        }
        let HTML = `<b>${this.name}</b></br>You have <b>${this.amount}</b> ${this.name.toLowerCase()}(s).</br>Each ${this.name.toLowerCase()} produces <b>${Format(SingleEffect)}</b> cookie(s).</br>All of your ${this.name.toLowerCase()}(s) combined produces <b>${Format(this.effect)}</b> cookie(s).</br>${this.generateBuyButtons()}</br>${this.generateUpgradeButtons()}`;
        return HTML;
    }
}

class Upgrade {
    constructor(name, cost, desc, limit, special = false) {
        this.name = name;
        this.cost = cost;
        this.desc = desc;
        this.limit = limit; 
        this.owned = false;
        this.special = special;
    }

    requirementMet(amount) {
        if (amount >= this.limit) {
            return true;
        }
    }
}

class Player {
    constructor() {
        this.cookies = 0;
        this.cookieStats = {
            Earned: 0,
            Spent: 0,
            Clicked: 0
        }
        this.AMPS = 0;
        this.AMPC = 1;
    }

    earnCookie(amount) {
        this.cookies += amount;
        this.cookieStats.Earned += amount;
    }

    spendCookies(amount) {
        if (this.cookies >= amount) {
            this.cookies -= amount;
            this.cookieStats.Spent += amount;
            return true;
        }
    } 

    clickCookie() {
        this.earnCookie(this.AMPC);
        this.cookieStats.Clicked += this.AMPC;
    }
}

var Game = {
    Settings: {
        Framerate: 30,
        RecalculateCPS: true
    },
    Buildings: [
        // Generate all buildings here
        new Building('Cursor', 100, 0.1, [
            new Upgrade('Reinforced Index Finger', 100, 'Cursors and clicking are twice as efficient', 1),
            new Upgrade('Carpal tunnel prevention cream', 500, 'Cursors and clicking are twice as efficient', 1),
            new Upgrade('Ambidextrous', 10000, 'Cursors and clicking are twice as efficient', 10),
            new Upgrade('Thousand Fingers', 100000, 'Mouse and cursors gain +0.1 cookies for every non-cursor building owned', 25, 0.1),
            new Upgrade('Million Fingers', 10000000, 'Mouse and cursors gain +0.5 cookies for every non-cursor building owned', 50, 0.5),
            new Upgrade('Billion Fingers', 100000000, 'Mouse and cursors gain +5 cookies for every non-cursor building owned', 100, 5),
            new Upgrade('Trillion Fingers', 1000000000, 'Mouse and cursors gain +50 for every non-cursor building owned', 150, 50),
            new Upgrade('Quadrillion Fingers', 10000000000, 'Mouse and cursors gain +500 cookies for each non-cursor building owned', 200, 500),
            new Upgrade('Quintillion Fingers', 10000000000000, 'Mouse and cursors gain +5.000K for every non-cursor building owned', 250, 5000),
            new Upgrade('Sextillion Fingers', 10000000000000000, ' Mouse and cursors gain +50.000K for every non-cursor building owned', 300, 50000),
            new Upgrade('Septillion Fingers', 10000000000000000000, 'Mouse and cursors gain +500.000K for every non-cursor building owned', 350, 500000),
            new Upgrade('Octillion Fingers', 10000000000000000000000, 'Mouse and cursors gain +5.000M for each non-cursor building owned', 400, 5000000)
        ], false),
        new Building('Grandma', 300, 3, [
            new Upgrade('Forwards from grandma', 1000, 'Grandmas are twice as efficient', 1),
            new Upgrade('Steel-plated rolling pins', 5000, 'Grandmas are twice as efficient', 5),
            new Upgrade('Lubricated dentures', 50000, 'Grandmas are twice as efficient', 25),
            new Upgrade('Prune juice', 5000000, 'Grandmas are twice as efficient', 50),
            new Upgrade('Double-thick glasses', 500000000, 'Grandmas are twice as efficient', 100),
            new Upgrade('Aging agents', 50000000000, 'Grandmas are twice as efficient', 150),
            new Upgrade('Xtreme walkers', 50000000000000, 'Grandmas are twice as efficient', 200),
            new Upgrade('The Unbridling', 50000000000000000, 'Grandmas are twice as efficient', 250),
            new Upgrade('Reverse dementia', 50000000000000000000, 'Grandmas are twice as efficient', 300),
            new Upgrade('Timeproof hair dyes', 50000000000000000000000, 'Grandmas are twice as efficient', 350),
            new Upgrade('Good manners', 500000000000000000000000000, 'Grandmas are twice as efficient', 400),
        ]),
        new Building('Farm', 1100, 8, [
            new Upgrade('Cheap hoes', 11000, 'Farms are twice as efficient', 1),
            new Upgrade('Fertilizer', 55000, 'Farms are twice as efficient', 5),
            new Upgrade('Biscuit Trees', 550000, 'Farms are twice as efficient', 25),
            new Upgrade('Genetically-modified Biscuits', 55000000, 'Farms are twice as efficient', 50),
            new Upgrade('Gingerbread scarecrows', 5500000000, 'Farms are twice as efficient', 100),
            new Upgrade('Pulsar sprinklers', 550000000000, 'Farms are twice as efficient', 150),
            new Upgrade('Fudge fungus', 550000000000000, 'Farms are twice as efficient', 200),
            new Upgrade('Wheat triffids', 550000000000000000, 'Farms are twice as efficient', 250),
            new Upgrade('Humane pesticides', 550000000000000000000, 'Farms are twice as efficient', 300),
            new Upgrade('Barnstars', 550000000000000000000000, 'Ah, yes. These help quite a bit. Somehow.', 350),
            new Upgrade('Lindworms', 5500000000000000000000000000, 'You have to import these from far up north, but they really help areate the soil', 400)
        ]),
        new Building('Mine', 12000, 47, [
            new Upgrade('Sugar gas', 120000, 'Mines are twice as efficient', 1),
            new Upgrade('Megadrill', 600000, 'Mines are twice as efficient', 5),
            new Upgrade('Ultradrill', 6000000, 'Mines are twice as efficient', 25),
            new Upgrade('Ultimadrill', 600000000, 'Mines are twice as efficient', 50),
            new Upgrade('H-bomb Mining', 60000000000, 'Mines are twice as efficient', 100),
            new Upgrade('Coreforge', 6000000000000, 'Mines are twice as efficient', 150),
            new Upgrade('Planetsplitters', 6000000000000000, 'Mines are twice as efficient', 200),
            new Upgrade('Canola oil wells', 6000000000000000000, 'Mines are twice as efficient', 250),
            new Upgrade('Mole People', 6000000000000000000000, 'Mines are twice as efficient', 300)
        ]),
        new Building('Factory', 130000, 260, [
            new Upgrade('Sturdier conveyor belts', 1300000, 'Factories are twice as efficient', 1),
            new Upgrade('Child labor', 6500000, 'Factories are twice as efficient', 5),
            new Upgrade('Sweatshop', 65000000, 'Factories are twice as efficient', 25),
            new Upgrade('Radium reactors', 6500000000, 'Factories are twice as efficient', 50),
            new Upgrade('Recombobulators', 650000000000, 'Factories are twice as efficient', 100),
            new Upgrade('Deep-bake process', 65000000000000, 'Factories are twice as efficient', 150),
            new Upgrade('Cyborg workforce', 65000000000000000, 'Factories are twice as efficient', 200),
            new Upgrade('78-hour days', 65000000000000000000, 'Factories are twice as efficient', 250),
            new Upgrade('Machine learning', 65000000000000000000000, 'Factories are twice as efficient', 300)
        ]),
        new Building('Bank', 1400000, 1400, [
            new Upgrade('Taller Tellers', 14000000, 'Banks are twice as efficient', 1),
            new Upgrade('Scissor-resistant Credit Cards', 70000000, 'Banks are twice as efficient', 5),
            new Upgrade('Acid-proof vaults', 700000000, 'Banks are twice as efficient', 25),
            new Upgrade('Chocolate coins', 70000000000, 'Banks are twice as efficient', 50),
            new Upgrade('Exponential interest rates', 7000000000000, 'Banks are twice as efficient', 100),
            new Upgrade('Financial zen', 700000000000000, 'Banks are twice as efficient', 150),
            new Upgrade('Way of the wallet', 700000000000000000, 'Banks are twice as efficient', 200),
            new Upgrade('The stuff rationale', 700000000000000000000, 'Banks are twice as efficient', 250),
            new Upgrade('Edible money', 700000000000000000000, 'Banks are twice as efficient', 300)
        ]),
        new Building('Temple', 20000000, 7800, [
            new Upgrade('Golden idols', 200000000, 'Temples are twice as efficient', 1),
            new Upgrade('Sacrifices', 1000000000, 'Temples are twice as efficient', 5),
            new Upgrade('Delicious blessing', 10000000000, 'Temples are twice as efficient', 25),
            new Upgrade('Sun festival', 1000000000000, 'Temples are twice as efficient', 50),
            new Upgrade('Enlarged pantheon', 100000000000000, 'Temples are twice as efficient', 100),
            new Upgrade('Great Baker in the sky', 10000000000000000, 'Temples are twice as efficient', 150),
            new Upgrade('Creation myth', 10000000000000000000, 'Temples are twice as efficient', 200),
            new Upgrade('Theocracy', 10000000000000000000000, 'Temples are twice as efficient', 250),
            new Upgrade('Sick rap prayers', 10000000000000000000000000, 'Temples are twice as efficient', 300)
        ]),
        new Building('Wizard Tower', 330000000, 44000, [
            new Upgrade('Pointier hats', 3300000000, 'Wizard towers are twice as efficient', 1),
            new Upgrade('Beardlier beards', 16500000000, 'Wizard towers are twice as efficient', 5),
            new Upgrade('Ancient grimoires', 165000000000, 'Wizard towers are twice as efficient', 25),
            new Upgrade('Kitchen curses', 16500000000000, 'Wizard towers are twice as efficient', 50),
            new Upgrade('School of sorcery', 1650000000000000, 'Wizard towers are twice as efficient', 100),
            new Upgrade('Dark formulas', 165000000000000000, 'Wizard towers are twice as efficient', 150),
            new Upgrade('Cookiemancy', 165000000000000000000, 'Wizard towers are twice as efficient', 200),
            new Upgrade('Rabbit trick', 165000000000000000000000, 'Wizard towers are twice as efficient', 250),
            new Upgrade('Deluxe tailored wands', 165000000000000000000000000, 'Wizard towers are twice as efficient', 300)
        ]),
        new Building('Shipment', 5100000000, 260000, [
            new Upgrade('Vanilla nebulae', 51000000000, 'Shipments are twice as efficient', 1),
            new Upgrade('Wormholes', 255000000000, 'Shipments are twice as efficient', 5),
            new Upgrade('Frequent flyer', 2550000000000, 'Shipments are twice as efficient', 25),
            new Upgrade('Warp drive', 255000000000000, 'Shipments are twice as efficient', 50),
            new Upgrade('Chocolate monoliths', 25500000000000000, 'Shipments are twice as efficient', 100),
            new Upgrade('Generation ship', 2550000000000000000, 'Shipments are twice as efficient', 150),
            new Upgrade('Dyson sphere', 2550000000000000000000, 'Shipments are twice as efficient', 200),
            new Upgrade('The final frontier', 2550000000000000000000000, 'Shipments are twice as efficient', 250),
            new Upgrade('Autopilot', 2550000000000000000000000000, 'Shipments are twice as efficient', 300)
        ]),
        new Building('Alchemy Lab', 75000000000, 1500000, [
            new Upgrade('Antimony', 750000000000, 'Alchemy labs are twice as efficient', 1),
            new Upgrade('Essence of dough', 3750000000000, 'Alchemy labs are twice as efficient', 5),
            new Upgrade('True chocolate', 37500000000000, 'Alchemy labs are twice as efficient', 25),
            new Upgrade('Ambrosia', 3750000000000000, 'Alchemy labs are twice as efficient', 50),
            new Upgrade('Aqua crustulae', 375000000000000000, 'Alchemy labs are twice as efficient', 100),
            new Upgrade('Origin crucible', 37500000000000000000, 'Alchemy labs are twice as efficient', 150),
            new Upgrade('Theory of atomic fluidity', 37500000000000000000000, 'Alchemy labs are twice as efficient', 200),
            new Upgrade('Beige goo', 37500000000000000000000000, 'Alchemy labs are twice as efficient', 250),
            new Upgrade('The advent of chemistry', 37500000000000000000000000000, 'Alchemy labs are twice as efficient', 300)
        ]),
        new Building('Portal', 1000000000000, 10000000, [
            new Upgrade('Ancient tablet', 10000000000000, 'Portals are twice as efficient', 1),
            new Upgrade('Insane oatling workers', 50000000000000, 'Portals are twice as efficient', 5),
            new Upgrade('Soul bond', 500000000000000, 'Portals are twice as efficient', 25),
            new Upgrade('Sanity dance', 50000000000000000, 'Portals are twice as efficient', 50),
            new Upgrade('Brane transplant', 5000000000000000000, 'Portals are twice as efficient', 100),
            new Upgrade('Deity-sized portals', 500000000000000000000, 'Portals are twice as efficient', 150),
            new Upgrade('End of times back-up plan', 500000000000000000000000, 'Portals are twice as efficient', 200),
            new Upgrade('Maddening chants', 500000000000000000000000000, 'Portals are twice as efficient', 250),
            new Upgrade('The real world', 500000000000000000000000000000, 'Portals are twice as efficient', 300)
        ]),
        new Building('Time Machine', 14000000000000, 65000000, [
            new Upgrade('Flux capacitors', 140000000000000, 'Time machines are twice as efficient', 1),
            new Upgrade('Time paradox resolver', 700000000000000, 'Time machines are twice as efficient', 5),
            new Upgrade('Quantum conundrum', 7000000000000000, 'Time machines are twice as efficient', 25),
            new Upgrade('Causality enforcer', 700000000000000000, 'Time machines are twice as efficient', 50),
            new Upgrade('Yestermorrow comparators', 70000000000000000000, 'Time machines are twice as efficient', 100),
            new Upgrade('Far future enactment', 7000000000000000000000, 'Time machines are twice as efficient', 150),
            new Upgrade('Great loop hypothesis', 7000000000000000000000000, 'Time machines are twice as efficient', 200),
            new Upgrade('Cookietopian moments of maybe', 7000000000000000000000000000, 'Time machines are twice as efficient', 250),
            new Upgrade('Second seconds', 7000000000000000000000000000000, 'Time machines are twice as efficient', 300)
        ]),
        new Building('Antimatter Condenser', 170000000000000, 430000000, [
            new Upgrade('Sugar bosons', 1700000000000000, 'Antimatter condensers are twice as efficient', 1),
            new Upgrade('String theory', 8500000000000000, 'Antimatter condensers are twice as efficient', 5),
            new Upgrade('Large macaron collider', 85000000000000000, 'Antimatter condensers are twice as efficient', 25),
            new Upgrade('Big bang bake', 8500000000000000000, 'Antimatter condensers are twice as efficient', 50),
            new Upgrade('Reverse cyclotrons', 850000000000000000000, 'Antimatter condensers are twice as efficient', 100),
            new Upgrade('Nanocosmics', 85000000000000000000000, 'Antimatter condensers are twice as efficient', 150),
            new Upgrade('The Pulse', 85000000000000000000000000, 'Antimatter condensers are twice as efficient', 200),
            new Upgrade('Some other super-tiny fundamental particle? Probably?', 85000000000000000000000000000, 'Antimatter condensers are twice as efficient', 250),
            new Upgrade('Quantum comb', 85000000000000000000000000000000, 'Antimatter condensers are twice as efficient', 300)
        ]),
        new Building('Prism', 2100000000000000, 2900000000, [
            new Upgrade('Gem polish', 21000000000000000, 'Prims are twice as efficient', 1),
            new Upgrade('9th color', 105000000000000000, 'Prims are twice as efficient', 5),
            new Upgrade('Chocolate light', 1050000000000000000, 'Prims are twice as efficient', 25),
            new Upgrade('Grainbow', 105000000000000000000, 'Prims are twice as efficient', 50),
            new Upgrade('Pure cosmic light', 10500000000000000000000, 'Prims are twice as efficient', 100),
            new Upgrade('Glow-in-the-dark', 1050000000000000000000000, 'Prims are twice as efficient', 150),
            new Upgrade('Lux sanctorum', 1050000000000000000000000000, 'Prims are twice as efficient', 200),
            new Upgrade('Reverse shadows', 1050000000000000000000000000000, 'Prims are twice as efficient', 250),
            new Upgrade('Crystal mirrors', 1050000000000000000000000000000000, 'Prims are twice as efficient', 300)
        ]),
        new Building('Chancemaker', 26000000000000000, 21000000000, [
            new Upgrade('Your lucky cookie', 260000000000000000, 'Chancemakers are twice as efficient', 1),
            new Upgrade('\'All Bets Are Off\' magic coin', 130000000000000000, 'Chancemakers are twice as efficient', 5),
            new Upgrade('Winning lottery ticket', 13000000000000000000, 'Chancemakers are twice as efficient', 25),
            new Upgrade('Four-leaf clover field', 130000000000000000000, 'Chancemakers are twice as efficient', 50),
            new Upgrade('A recipe book about books', 13000000000000000000000, 'Chancemakers are twice as efficient', 100),
            new Upgrade('Leprechaun village', 13000000000000000000000000, 'Chancemakers are twice as efficient', 150),
            new Upgrade('Improbability drive', 13000000000000000000000000000, 'Chancemakers are twice as efficient', 200),
            new Upgrade('Antisuperstistronics', 13000000000000000000000000000000, 'Chancemakers are twice as efficient', 250),
            new Upgrade('Bunnypedes', 13000000000000000000000000000000000, 'Chancemakers are twice as efficient', 300)
        ]),
        new Building('Fractal Engine', 310000000000000000, 150000000000, [

        ])
    ],
    Utilities: {
        ShortNumbers: ['K', 'M', 'B', 'T', 'Qua', 'Qui', 'Sex', 'Sep', 'Oct', 'Non', 'Dec', 'Und', 'Duo', 'Tre', 'QuaD', 'QuiD', 'SexD', 'SepD', 'OctD', 'NonD', 'Vig'],
        UpdateText: function(id, text) {
            $(id).html(text)
        },
        FormatNumber: function(number) {
            let formatted = '';
            if (number >= 1000) {
                for (var i = 0; i < Game.Utilities.ShortNumbers.length - 1; i++) {
                    let divider = Math.pow(10, (i + 1) * 3)
                    if (number >= divider) {
                        formatted = (Math.trunc((number / divider) * 1000) / 1000).toFixed(3) + ' ' + Game.Utilities.ShortNumbers[i];
                    }
                }
                return formatted;
            }
            return (Math.trunc(number * 10) / 10).toFixed(1);
        },
        GetBuildingByName: function(name) {
            let correctBuilding = null;
            Game.Buildings.forEach(building => {
                if (building.name == name) {
                    correctBuilding = building;
                    return;
                }
            });
            return correctBuilding;
        },
        GetBuildingIndexByName: function(name) {
            for (let i = 0; i < Game.Buildings.length - 1; i++) {
                let curBuilding = Game.Buildings[i];
                if (curBuilding.name == name) {
                    return i;
                }
            }
        },
        GetBuildingCount: function() {
            let amount = 0;
            Game.Buildings.forEach(building => {
                amount += building.amount;
            });
            return amount;
        }
    },
    Player: new Player(),
    Logic: function() {
        Game.UpdateDisplays();

        // Only recalculate it when needed, saves on some processing power because this can turn out to be quite a lot of maths.
        if (Game.Settings.RecalculateCPS == true) {
            let CPS = 0;
            Game.Buildings.forEach(building => {
                CPS += building.getCPS();
            });
            Game.Settings.RecalculateCPS = false;
            Game.Player.AMPS = CPS / Game.Settings.Framerate;
            Game.UpdateShop(Game.CurrentShop);
        }

        Game.Player.earnCookie(Game.Player.AMPS);
        setTimeout(Game.Logic, 1000 / Game.Settings.Framerate);
    },
    UpdateDisplays: function() {
        // Create temporary shorthand aliases for ease of use.
        let Utils = Game.Utilities;
        let Player = Game.Player;
        let Stats = Player.cookieStats;

        Utils.UpdateText('[id=cookieDisplay]', Utils.FormatNumber(Player.cookies));
        Utils.UpdateText('[id=cpcDisplay]', Utils.FormatNumber(Player.AMPC));
        Utils.UpdateText('[id=cpsDisplay]', Utils.FormatNumber(Player.AMPS * Game.Settings.Framerate));
        Utils.UpdateText('#earnedDisplay', Utils.FormatNumber(Stats.Earned));
        Utils.UpdateText('#spentDisplay', Utils.FormatNumber(Stats.Spent));
        Utils.UpdateText('#clickedDisplay', Utils.FormatNumber(Stats.Clicked));
    },
    ConstructShop: function() {
        let Buildings = Game.Buildings;
        let FinalHTML = '';
        Buildings.forEach(building => {
            if (building.locked == false) {
                FinalHTML += building.generateMenuButton();
            }
        });
        Game.Utilities.UpdateText('#shopList', FinalHTML);
    },
    CurrentShop: 'Cursor',
    UpdateShop: function(name) {
        Game.CurrentShop = name;
        let FinalHTML = '';
        let building = Game.Utilities.GetBuildingByName(name);
        FinalHTML += building.generateShopHTML();
        Game.Utilities.UpdateText('#shop', FinalHTML);
    },
    BuyBuilding: function(name, amount) {
        let building = Game.Utilities.GetBuildingByName(name);
        building.buy(amount);
    },
    BuyUpgrade: function(buildingName, upgrade) {
        let building = Game.Utilities.GetBuildingByName(buildingName);
        building.buyUpgrade(upgrade);
    },
    Start: function() {
        // This prevents the user from holding down enter to click the cookie very quickly.
        $(document).ready(function() {
            $(window).keydown(function(event){
                if (event.keyCode == 13 || event.keyCode == 32) {
                    event.preventDefault();
                    return false;
                }
            });
        });
        // This enables the cookie clicking process.
        $('.cookieButton').on('click', function() {
            Game.Player.clickCookie();
        });
        Game.ConstructShop();
        Game.Logic();
    }
}

Game.Start();