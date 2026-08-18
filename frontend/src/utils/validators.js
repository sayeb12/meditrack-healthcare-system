export const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
    );
};


export const isValidBDPhone = (phone) => {
    return /^(?:01[3-9]\d{8}|\+8801[3-9]\d{8})$/.test(
        phone.trim()
    );
};


export const getPasswordRules = (password) => {
    return {
        length: password.length >= 10,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    };
};


export const getPasswordStrength = (password) => {
    const rules = getPasswordRules(password);

    const score = Object.values(
        rules
    ).filter(Boolean).length;

    if (!password) {
        return {
            score: 0,
            label: "",
        };
    }

    if (score <= 2) {
        return {
            score,
            label: "Weak",
        };
    }

    if (score <= 4) {
        return {
            score,
            label: "Medium",
        };
    }

    return {
        score,
        label: "Strong",
    };
};


const secureRandomCharacter = (characters) => {
    const random = new Uint32Array(1);

    crypto.getRandomValues(random);

    return characters[
        random[0] % characters.length
    ];
};


export const generateSecurePassword = () => {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const special = "!@#$%^&*?";

    const allCharacters =
        uppercase +
        lowercase +
        numbers +
        special;

    const characters = [
        secureRandomCharacter(uppercase),
        secureRandomCharacter(lowercase),
        secureRandomCharacter(numbers),
        secureRandomCharacter(special),
    ];

    while (characters.length < 16) {
        characters.push(
            secureRandomCharacter(allCharacters)
        );
    }

    for (
        let index = characters.length - 1;
        index > 0;
        index--
    ) {
        const random = new Uint32Array(1);

        crypto.getRandomValues(random);

        const target =
            random[0] % (index + 1);

        [
            characters[index],
            characters[target],
        ] = [
            characters[target],
            characters[index],
        ];
    }

    return characters.join("");
};