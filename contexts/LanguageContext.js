import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRANSLATIONS } from '../i18n/translations';

const LANGUAGE_KEY = 'app_language';

const LanguageContext = createContext({
    language: 'fr',
    t: TRANSLATIONS.fr,
    setLanguage: () => { },
});

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState('fr');

    useEffect(() => {
        AsyncStorage.getItem(LANGUAGE_KEY).then((saved) => {
            if (saved && TRANSLATIONS[saved]) setLanguageState(saved);
        });
    }, []);

    const setLanguage = async (code) => {
        if (!TRANSLATIONS[code]) return;
        setLanguageState(code);
        await AsyncStorage.setItem(LANGUAGE_KEY, code);
    };

    return (
        <LanguageContext.Provider value={{ language, t: TRANSLATIONS[language], setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
