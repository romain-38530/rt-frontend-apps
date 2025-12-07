/**
 * Composant d'autocomplétion d'adresse
 * - API Adresse Gouv.fr pour la France (gratuit, illimité)
 * - OpenStreetMap Nominatim pour l'Europe (gratuit, limité à 1 req/sec)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

export type AddressProvider = 'france' | 'europe' | 'auto';

export interface AddressSuggestion {
  label: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  provider: 'gouv-fr' | 'nominatim';
}

export interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: AddressSuggestion) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  minChars?: number;
  debounceMs?: number;
  /**
   * Fournisseur d'adresses:
   * - 'france': API Adresse Gouv.fr uniquement (recommandé pour France)
   * - 'europe': OpenStreetMap Nominatim uniquement (toute l'Europe)
   * - 'auto': France d'abord, puis Europe si pas de résultats
   */
  provider?: AddressProvider;
  /** Pays à filtrer pour Nominatim (codes ISO 3166-1 alpha-2) */
  countries?: string[];
  /** Afficher le sélecteur de région */
  showRegionSelector?: boolean;
}

// Liste des pays européens pour le filtre Nominatim
const EUROPEAN_COUNTRIES = [
  'fr', 'de', 'es', 'it', 'pt', 'be', 'nl', 'lu', 'ch', 'at',
  'gb', 'ie', 'pl', 'cz', 'sk', 'hu', 'ro', 'bg', 'hr', 'si',
  'gr', 'dk', 'se', 'no', 'fi', 'ee', 'lv', 'lt'
];

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Rechercher une adresse...',
  disabled = false,
  style,
  inputStyle,
  minChars = 3,
  debounceMs = 300,
  provider = 'auto',
  countries = EUROPEAN_COUNTRIES,
  showRegionSelector = true,
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedProvider, setSelectedProvider] = useState<AddressProvider>(provider);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche via API Adresse Gouv.fr (France)
  const searchFrenchAddresses = async (query: string): Promise<AddressSuggestion[]> => {
    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&autocomplete=1`
      );

      if (!response.ok) return [];

      const data = await response.json();

      return data.features.map((feature: any) => ({
        label: feature.properties.label,
        street: feature.properties.name || feature.properties.street || '',
        city: feature.properties.city || '',
        postalCode: feature.properties.postcode || '',
        country: 'France',
        countryCode: 'FR',
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        provider: 'gouv-fr' as const,
      }));
    } catch (error) {
      console.error('Erreur API Adresse Gouv.fr:', error);
      return [];
    }
  };

  // Recherche via OpenStreetMap Nominatim (Europe)
  const searchNominatimAddresses = async (query: string): Promise<AddressSuggestion[]> => {
    try {
      const countryFilter = countries.join(',');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}` +
        `&format=json` +
        `&addressdetails=1` +
        `&limit=5` +
        `&countrycodes=${countryFilter}`,
        {
          headers: {
            'Accept-Language': 'fr',
            'User-Agent': 'SYMPHONI.A-Logistics-Platform/1.0',
          },
        }
      );

      if (!response.ok) return [];

      const data = await response.json();

      return data.map((item: any) => {
        const addr = item.address || {};
        const street = addr.road || addr.pedestrian || addr.footway || addr.street || '';
        const houseNumber = addr.house_number || '';
        const fullStreet = houseNumber ? `${houseNumber} ${street}` : street;

        return {
          label: item.display_name,
          street: fullStreet || item.name || '',
          city: addr.city || addr.town || addr.village || addr.municipality || '',
          postalCode: addr.postcode || '',
          country: addr.country || '',
          countryCode: addr.country_code?.toUpperCase() || '',
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          provider: 'nominatim' as const,
        };
      });
    } catch (error) {
      console.error('Erreur Nominatim:', error);
      return [];
    }
  };

  // Recherche d'adresses selon le provider
  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < minChars) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      let results: AddressSuggestion[] = [];

      if (selectedProvider === 'france') {
        results = await searchFrenchAddresses(query);
      } else if (selectedProvider === 'europe') {
        results = await searchNominatimAddresses(query);
      } else {
        // Mode auto: France d'abord, puis Europe si pas assez de résultats
        results = await searchFrenchAddresses(query);

        if (results.length < 3) {
          const europeanResults = await searchNominatimAddresses(query);
          // Filtrer les doublons France
          const uniqueEuropean = europeanResults.filter(
            (eu) => !results.some((fr) =>
              fr.city.toLowerCase() === eu.city.toLowerCase() &&
              fr.postalCode === eu.postalCode
            )
          );
          results = [...results, ...uniqueEuropean].slice(0, 7);
        }
      }

      setSuggestions(results);
      setIsOpen(results.length > 0);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error('Erreur recherche adresse:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [minChars, selectedProvider, countries]);

  // Debounce de la recherche
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, debounceMs);
  };

  // Sélection d'une suggestion
  const handleSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.street);
    onSelect(suggestion);
    setIsOpen(false);
    setSuggestions([]);
  };

  // Navigation au clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // Changement de provider
  const handleProviderChange = (newProvider: AddressProvider) => {
    setSelectedProvider(newProvider);
    setSuggestions([]);
    if (value.length >= minChars) {
      setTimeout(() => searchAddresses(value), 100);
    }
  };

  const defaultInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    ...inputStyle,
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    maxHeight: '280px',
    overflowY: 'auto',
    marginTop: '4px',
  };

  const suggestionStyle = (isHighlighted: boolean): React.CSSProperties => ({
    padding: '12px 16px',
    cursor: 'pointer',
    backgroundColor: isHighlighted ? '#f3f4f6' : 'white',
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.15s',
  });

  const regionButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    border: isActive ? '2px solid #667eea' : '1px solid #e5e7eb',
    borderRadius: '6px',
    backgroundColor: isActive ? '#f0f4ff' : 'white',
    color: isActive ? '#667eea' : '#6b7280',
    fontSize: '12px',
    fontWeight: isActive ? '600' : '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  const getProviderIcon = (prov: 'gouv-fr' | 'nominatim') => {
    return prov === 'gouv-fr' ? '🇫🇷' : '🇪🇺';
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', ...style }}>
      {/* Sélecteur de région */}
      {showRegionSelector && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button
            type="button"
            onClick={() => handleProviderChange('france')}
            style={regionButtonStyle(selectedProvider === 'france')}
          >
            🇫🇷 France
          </button>
          <button
            type="button"
            onClick={() => handleProviderChange('europe')}
            style={regionButtonStyle(selectedProvider === 'europe')}
          >
            🇪🇺 Europe
          </button>
          <button
            type="button"
            onClick={() => handleProviderChange('auto')}
            style={regionButtonStyle(selectedProvider === 'auto')}
          >
            🌍 Auto
          </button>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          style={defaultInputStyle}
          autoComplete="off"
        />
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '12px',
              color: '#6b7280',
            }}
          >
            ...
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div style={dropdownStyle}>
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.label}-${index}`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              style={suggestionStyle(index === highlightedIndex)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>
                  {getProviderIcon(suggestion.provider)}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                    {suggestion.street || suggestion.city}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    {suggestion.postalCode} {suggestion.city}
                    {suggestion.country && suggestion.country !== 'France' && (
                      <span style={{ marginLeft: '4px', color: '#9ca3af' }}>
                        - {suggestion.country}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
