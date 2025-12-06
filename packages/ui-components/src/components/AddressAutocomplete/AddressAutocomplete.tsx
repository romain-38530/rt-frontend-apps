/**
 * Composant d'autocomplétion d'adresse utilisant l'API Adresse du gouvernement français
 * https://api-adresse.data.gouv.fr/
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface AddressSuggestion {
  label: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
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
}

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
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
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

  // Recherche d'adresses via l'API
  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < minChars) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&autocomplete=1`
      );

      if (!response.ok) {
        throw new Error('Erreur API');
      }

      const data = await response.json();

      const results: AddressSuggestion[] = data.features.map((feature: any) => ({
        label: feature.properties.label,
        street: feature.properties.name || feature.properties.street || '',
        city: feature.properties.city || '',
        postalCode: feature.properties.postcode || '',
        country: 'France',
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
      }));

      setSuggestions(results);
      setIsOpen(results.length > 0);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error('Erreur recherche adresse:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [minChars]);

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
    maxHeight: '250px',
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

  return (
    <div ref={wrapperRef} style={{ position: 'relative', ...style }}>
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
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                {suggestion.street}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                {suggestion.postalCode} {suggestion.city}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
