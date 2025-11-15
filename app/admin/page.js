'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

// Complete list of all countries with emoji flags and common abbreviations
const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', alt: [] },
  { code: 'AL', name: 'Albania', flag: '🇦🇱', alt: [] },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', alt: [] },
  { code: 'AS', name: 'American Samoa', flag: '🇦🇸', alt: [] },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩', alt: [] },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', alt: [] },
  { code: 'AI', name: 'Anguilla', flag: '🇦🇮', alt: [] },
  { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬', alt: [] },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', alt: [] },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲', alt: [] },
  { code: 'AW', name: 'Aruba', flag: '🇦🇼', alt: [] },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', alt: ['AUS', 'Aussie', 'Oz'] },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', alt: ['AUT', 'Österreich'] },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', alt: ['AZE'] },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸', alt: ['The Bahamas'] },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', alt: ['BHR'] },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', alt: ['BGD'] },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧', alt: ['BRB'] },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾', alt: ['BLR'] },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', alt: ['BEL'] },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿', alt: ['BLZ'] },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯', alt: ['BEN'] },
  { code: 'BM', name: 'Bermuda', flag: '🇧🇲', alt: ['BMU'] },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹', alt: ['BTN'] },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', alt: ['BOL'] },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦', alt: ['BIH', 'Bosnia'] },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼', alt: ['BWA'] },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', alt: ['BRA', 'Brasil'] },
  { code: 'VG', name: 'British Virgin Islands', flag: '🇻🇬', alt: ['BVI'] },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳', alt: ['BRN'] },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', alt: ['BGR'] },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', alt: ['BFA'] },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮', alt: ['BDI'] },
  { code: 'CV', name: 'Cabo Verde', flag: '🇨🇻', alt: ['Cape Verde', 'CPV'] },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭', alt: ['KHM', 'Kampuchea'] },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', alt: ['CMR'] },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', alt: ['CAN'] },
  { code: 'KY', name: 'Cayman Islands', flag: '🇰🇾', alt: ['CYM'] },
  { code: 'CF', name: 'Central African Republic', flag: '🇨🇫', alt: ['CAF', 'CAR'] },
  { code: 'TD', name: 'Chad', flag: '🇹🇩', alt: ['TCD'] },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', alt: ['CHL'] },
  { code: 'CN', name: 'China', flag: '🇨🇳', alt: ['CHN', 'PRC', "People's Republic of China"] },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', alt: ['COL'] },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲', alt: ['COM'] },
  { code: 'CG', name: 'Congo', flag: '🇨🇬', alt: ['COG', 'Republic of Congo'] },
  { code: 'CD', name: 'Congo (DRC)', flag: '🇨🇩', alt: ['COD', 'Democratic Republic of Congo', 'DRC', 'Zaire'] },
  { code: 'CK', name: 'Cook Islands', flag: '🇨🇰', alt: ['COK'] },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', alt: ['CRI'] },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', alt: ['CIV', 'Ivory Coast'] },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', alt: ['HRV', 'Hrvatska'] },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺', alt: ['CUB'] },
  { code: 'CW', name: 'Curaçao', flag: '🇨🇼', alt: ['CUW'] },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', alt: ['CYP'] },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', alt: ['CZE', 'Czechia'] },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', alt: ['DNK', 'Danmark'] },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', alt: ['DJI'] },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲', alt: ['DMA'] },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴', alt: ['DOM'] },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', alt: ['ECU'] },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', alt: ['EGY'] },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻', alt: ['SLV'] },
  { code: 'ENGLAND', name: 'England', flag: '🏴󐁧󐁢󐁥󐁮󐁧󐁿', alt: ['ENG'] },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶', alt: ['GNQ'] },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷', alt: ['ERI'] },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', alt: ['EST'] },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿', alt: ['SWZ', 'Swaziland'] },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', alt: ['ETH'] },
  { code: 'FO', name: 'Faroe Islands', flag: '🇫🇴', alt: ['FRO'] },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', alt: ['FJI'] },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', alt: ['FIN', 'Suomi'] },
  { code: 'FR', name: 'France', flag: '🇫🇷', alt: ['FRA'] },
  { code: 'GF', name: 'French Guiana', flag: '🇬🇫', alt: ['GUF'] },
  { code: 'PF', name: 'French Polynesia', flag: '🇵🇫', alt: ['PYF'] },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', alt: ['GAB'] },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲', alt: ['GMB', 'The Gambia'] },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪', alt: ['GEO'] },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', alt: ['GER', 'DEU', 'Deutschland'] },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', alt: ['GHA'] },
  { code: 'GI', name: 'Gibraltar', flag: '🇬🇮', alt: ['GIB'] },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', alt: ['GRC', 'Hellas'] },
  { code: 'GL', name: 'Greenland', flag: '🇬🇱', alt: ['GRL'] },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩', alt: ['GRD'] },
  { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵', alt: ['GLP'] },
  { code: 'GU', name: 'Guam', flag: '🇬🇺', alt: ['GUM'] },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', alt: ['GTM'] },
  { code: 'GG', name: 'Guernsey', flag: '🇬🇬', alt: ['GGY'] },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳', alt: ['GIN'] },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼', alt: ['GNB'] },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾', alt: ['GUY'] },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹', alt: ['HTI'] },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳', alt: ['HND'] },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', alt: ['HKG'] },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', alt: ['HUN', 'Magyarország'] },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸', alt: ['ISL', 'Ísland'] },
  { code: 'IN', name: 'India', flag: '🇮🇳', alt: ['IND', 'Bharat'] },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', alt: ['IDN'] },
  { code: 'IR', name: 'Iran', flag: '🇮🇷', alt: ['IRN', 'Persia'] },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶', alt: ['IRQ'] },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', alt: ['IRL', 'Éire'] },
  { code: 'IM', name: 'Isle of Man', flag: '🇮🇲', alt: ['IMN'] },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', alt: ['ISR'] },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', alt: ['ITA', 'Italia'] },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲', alt: ['JAM'] },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', alt: ['JPN', 'Nippon', 'Nihon'] },
  { code: 'JE', name: 'Jersey', flag: '🇯🇪', alt: ['JEY'] },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', alt: ['JOR'] },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', alt: ['KAZ'] },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', alt: ['KEN'] },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮', alt: ['KIR'] },
  { code: 'XK', name: 'Kosovo', flag: '🇽🇰', alt: ['KOS'] },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', alt: ['KWT'] },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬', alt: ['KGZ'] },
  { code: 'LA', name: 'Laos', flag: '🇱🇦', alt: ['LAO'] },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', alt: ['LVA'] },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', alt: ['LBN'] },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸', alt: ['LSO'] },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷', alt: ['LBR'] },
  { code: 'LY', name: 'Libya', flag: '🇱🇾', alt: ['LBY'] },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮', alt: ['LIE'] },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', alt: ['LTU'] },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', alt: ['LUX'] },
  { code: 'MO', name: 'Macau', flag: '🇲🇴', alt: ['MAC', 'Macao'] },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬', alt: ['MDG'] },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼', alt: ['MWI'] },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', alt: ['MYS'] },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻', alt: ['MDV'] },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', alt: ['MLI'] },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', alt: ['MLT'] },
  { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭', alt: ['MHL'] },
  { code: 'MQ', name: 'Martinique', flag: '🇲🇶', alt: ['MTQ'] },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷', alt: ['MRT'] },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺', alt: ['MUS'] },
  { code: 'YT', name: 'Mayotte', flag: '🇾🇹', alt: ['MYT'] },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', alt: ['MEX', 'México'] },
  { code: 'FM', name: 'Micronesia', flag: '🇫🇲', alt: ['FSM'] },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩', alt: ['MDA'] },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨', alt: ['MCO'] },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳', alt: ['MNG'] },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪', alt: ['MNE'] },
  { code: 'MS', name: 'Montserrat', flag: '🇲🇸', alt: ['MSR'] },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', alt: ['MAR'] },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', alt: ['MOZ'] },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲', alt: ['MMR', 'Burma'] },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦', alt: ['NAM'] },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷', alt: ['NRU'] },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', alt: ['NPL'] },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', alt: ['NLD', 'Holland', 'Nederland'] },
  { code: 'NC', name: 'New Caledonia', flag: '🇳🇨', alt: ['NCL'] },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', alt: ['NZL', 'Aotearoa'] },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', alt: ['NIC'] },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', alt: ['NER'] },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', alt: ['NGA'] },
  { code: 'NU', name: 'Niue', flag: '🇳🇺', alt: ['NIU'] },
  { code: 'KP', name: 'North Korea', flag: '🇰🇵', alt: ['PRK', 'DPRK'] },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰', alt: ['MKD', 'Macedonia'] },
  { code: 'MP', name: 'Northern Mariana Islands', flag: '🇲🇵', alt: ['MNP'] },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', alt: ['NOR', 'Norge'] },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', alt: ['OMN'] },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', alt: ['PAK'] },
  { code: 'PW', name: 'Palau', flag: '🇵🇼', alt: ['PLW'] },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸', alt: ['PSE'] },
  { code: 'PA', name: 'Panama', flag: '🇵🇦', alt: ['PAN'] },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬', alt: ['PNG'] },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', alt: ['PRY'] },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', alt: ['PER'] },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', alt: ['PHL', 'Pilipinas'] },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', alt: ['POL', 'Polska'] },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', alt: ['PRT'] },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷', alt: ['PRI'] },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', alt: ['QAT'] },
  { code: 'RE', name: 'Réunion', flag: '🇷🇪', alt: ['REU'] },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', alt: ['ROU', 'România'] },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', alt: ['RUS', 'Russian Federation'] },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', alt: ['RWA'] },
  { code: 'BL', name: 'Saint Barthélemy', flag: '🇧🇱', alt: ['BLM', 'St. Barts'] },
  { code: 'SH', name: 'Saint Helena', flag: '🇸🇭', alt: ['SHN'] },
  { code: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳', alt: ['KNA', 'St. Kitts'] },
  { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨', alt: ['LCA', 'St. Lucia'] },
  { code: 'MF', name: 'Saint Martin', flag: '🇲🇫', alt: ['MAF', 'St. Martin'] },
  { code: 'PM', name: 'Saint Pierre and Miquelon', flag: '🇵🇲', alt: ['SPM'] },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨', alt: ['VCT', 'St. Vincent'] },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸', alt: ['WSM'] },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲', alt: ['SMR'] },
  { code: 'ST', name: 'São Tomé and Príncipe', flag: '🇸🇹', alt: ['STP'] },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', alt: ['SAU', 'KSA'] },
  { code: 'SCOTLAND', name: 'Scotland', flag: '🏴󐁧󐁢󐁳󐁣󐁴󐁿', alt: ['SCO', 'Alba'] },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', alt: ['SEN'] },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸', alt: ['SRB'] },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨', alt: ['SYC'] },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', alt: ['SLE'] },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', alt: ['SGP'] },
  { code: 'SX', name: 'Sint Maarten', flag: '🇸🇽', alt: ['SXM'] },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', alt: ['SVK'] },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', alt: ['SVN'] },
  { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧', alt: ['SLB'] },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴', alt: ['SOM'] },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', alt: ['ZAF', 'RSA'] },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', alt: ['KOR', 'ROK', 'Republic of Korea'] },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸', alt: ['SSD'] },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', alt: ['ESP', 'España'] },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', alt: ['LKA', 'Ceylon'] },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩', alt: ['SDN'] },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷', alt: ['SUR'] },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', alt: ['SWE', 'Sverige'] },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', alt: ['CHE', 'Swiss', 'Schweiz', 'Suisse'] },
  { code: 'SY', name: 'Syria', flag: '🇸🇾', alt: ['SYR'] },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', alt: ['TWN', 'ROC', 'Chinese Taipei'] },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯', alt: ['TJK'] },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', alt: ['TZA'] },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', alt: ['THA', 'Siam'] },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱', alt: ['TLS', 'East Timor'] },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', alt: ['TGO'] },
  { code: 'TK', name: 'Tokelau', flag: '🇹🇰', alt: ['TKL'] },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴', alt: ['TON'] },
  { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹', alt: ['TTO', 'T&T'] },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', alt: ['TUN'] },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', alt: ['TUR', 'Türkiye'] },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲', alt: ['TKM'] },
  { code: 'TC', name: 'Turks and Caicos', flag: '🇹🇨', alt: ['TCA', 'TCI'] },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻', alt: ['TUV'] },
  { code: 'VI', name: 'US Virgin Islands', flag: '🇻🇮', alt: ['VIR', 'USVI'] },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', alt: ['UGA'] },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', alt: ['UKR'] },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', alt: ['ARE', 'UAE'] },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', alt: ['GBR', 'UK', 'Britain', 'Great Britain'] },
  { code: 'US', name: 'United States', flag: '🇺🇸', alt: ['USA', 'America', 'US', 'States'] },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', alt: ['URY'] },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', alt: ['UZB'] },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺', alt: ['VUT'] },
  { code: 'VA', name: 'Vatican City', flag: '🇻🇦', alt: ['VAT', 'Holy See'] },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', alt: ['VEN'] },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', alt: ['VNM', 'Viet Nam'] },
  { code: 'WALES', name: 'Wales', flag: '🏴󐁧󐁢󐁷󐁬󐁳󐁿', alt: ['WAL', 'Cymru'] },
  { code: 'WF', name: 'Wallis and Futuna', flag: '🇼🇫', alt: ['WLF'] },
  { code: 'EH', name: 'Western Sahara', flag: '🇪🇭', alt: ['ESH'] },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪', alt: ['YEM'] },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', alt: ['ZMB'] },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', alt: ['ZWE'] },
].sort((a, b) => a.name.localeCompare(b.name))

// Custom searchable dropdown component
function CountryDropdown({ value, onChange, disabled, placeholder = "Search and select country..." }) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredCountries = COUNTRIES.filter(country => {
    const searchLower = search.toLowerCase()
    return (
      country.name.toLowerCase().includes(searchLower) ||
      country.code.toLowerCase().includes(searchLower) ||
      (country.alt && country.alt.some(alt => alt.toLowerCase().includes(searchLower)))
    )
  })

  const selectedCountry = value ? COUNTRIES.find(c => c.code === value) : null

  return (
    <div ref={dropdownRef} className="relative">
      <input
        type="text"
        value={isOpen ? search : (selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : '')}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => {
          setIsOpen(true)
          setSearch('')
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={disabled}
      />
      
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onChange('')
              setIsOpen(false)
              setSearch('')
            }}
            className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b"
          >
            -- No Country --
          </button>
          {filteredCountries.length === 0 ? (
            <div className="px-3 py-2 text-gray-500">No countries found</div>
          ) : (
            filteredCountries.map(country => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onChange(country.code)
                  setIsOpen(false)
                  setSearch('')
                }}
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center ${
                  value === country.code ? 'bg-blue-50' : ''
                }`}
              >
                <span className="mr-2 text-lg">{country.flag}</span>
                <span>{country.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [players, setPlayers] = useState([])
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerCountry, setNewPlayerCountry] = useState('')
  const [teamA, setTeamA] = useState([])
  const [teamB, setTeamB] = useState([])
  const [unassigned, setUnassigned] = useState([])
  const [teamAScore, setTeamAScore] = useState('')
  const [teamBScore, setTeamBScore] = useState('')
  const [gameDate, setGameDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [playerFilter, setPlayerFilter] = useState('')
  
  // New states for country management
  const [showCountryManager, setShowCountryManager] = useState(false)
  const [editMode, setEditMode] = useState({})
  const [countrySearchTerm, setCountrySearchTerm] = useState('')

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      console.error('Error fetching players:', error)
    } else {
      setPlayers(data || [])
      setUnassigned(data?.map(p => p.id) || [])
    }
  }

  const addPlayer = async (e) => {
    e.preventDefault()
    if (!newPlayerName.trim()) return

    setLoading(true)
    const { data, error } = await supabase
      .from('players')
      .insert([{ 
        name: newPlayerName.trim(),
        country: newPlayerCountry || null
      }])
      .select()

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      const countryFlag = newPlayerCountry ? COUNTRIES.find(c => c.code === newPlayerCountry)?.flag : ''
      setMessage(`Added player: ${countryFlag} ${newPlayerName}`)
      setNewPlayerName('')
      setNewPlayerCountry('')
      fetchPlayers()
    }
    setLoading(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const updatePlayerCountry = async (playerId, countryCode) => {
    setLoading(true)
    const { error } = await supabase
      .from('players')
      .update({ country: countryCode || null })
      .eq('id', playerId)

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      const player = players.find(p => p.id === playerId)
      const country = COUNTRIES.find(c => c.code === countryCode)
      setMessage(`Updated ${player.name}: ${country ? country.flag : 'No country'}`)
      fetchPlayers()
      setEditMode({ ...editMode, [playerId]: false })
    }
    setLoading(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const getCountryFlag = (countryCode) => {
    if (!countryCode) return ''
    const country = COUNTRIES.find(c => c.code === countryCode)
    return country ? country.flag : ''
  }

  const handleDragStart = (e, playerId, source) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('playerId', playerId)
    e.dataTransfer.setData('source', source)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, target) => {
    e.preventDefault()
    
    const playerId = parseInt(e.dataTransfer.getData('playerId'))
    const source = e.dataTransfer.getData('source')
    
    if (source === target) return

    // Remove from source
    if (source === 'unassigned') {
      setUnassigned(prev => prev.filter(id => id !== playerId))
    } else if (source === 'teamA') {
      setTeamA(prev => prev.filter(id => id !== playerId))
    } else if (source === 'teamB') {
      setTeamB(prev => prev.filter(id => id !== playerId))
    }

    // Add to target
    if (target === 'unassigned') {
      setUnassigned(prev => sortPlayersByName([...prev, playerId]))
    } else if (target === 'teamA' && teamA.length < 6) {
      setTeamA(prev => [...prev, playerId])
    } else if (target === 'teamB' && teamB.length < 6) {
      setTeamB(prev => [...prev, playerId])
    } else {
      // If target team is full, return to source
      if (source === 'unassigned') {
        setUnassigned(prev => sortPlayersByName([...prev, playerId]))
      } else if (source === 'teamA') {
        setTeamA(prev => [...prev, playerId])
      } else if (source === 'teamB') {
        setTeamB(prev => [...prev, playerId])
      }
    }
  }

  const sortPlayersByName = (playerIds) => {
    return playerIds.sort((a, b) => {
      const playerA = players.find(p => p.id === a)
      const playerB = players.find(p => p.id === b)
      return (playerA?.name || '').localeCompare(playerB?.name || '')
    })
  }

  const movePlayer = (playerId, from, to) => {
    // Remove from source
    if (from === 'unassigned') {
      setUnassigned(unassigned.filter(id => id !== playerId))
    } else if (from === 'teamA') {
      setTeamA(teamA.filter(id => id !== playerId))
    } else if (from === 'teamB') {
      setTeamB(teamB.filter(id => id !== playerId))
    }

    // Add to target
    if (to === 'unassigned') {
      setUnassigned(prev => sortPlayersByName([...prev, playerId]))
    } else if (to === 'teamA' && teamA.length < 6) {
      setTeamA([...teamA, playerId])
    } else if (to === 'teamB' && teamB.length < 6) {
      setTeamB([...teamB, playerId])
    }
  }

  const autoAssignTeams = () => {
    const allAvailable = [...unassigned, ...teamA, ...teamB]
    const shuffled = [...allAvailable].sort(() => Math.random() - 0.5)
    
    setTeamA(shuffled.slice(0, 6))
    setTeamB(shuffled.slice(6, 12))
    setUnassigned(shuffled.slice(12))
  }

  const resetTeams = () => {
    const allPlayers = [...unassigned, ...teamA, ...teamB]
    setUnassigned(sortPlayersByName(allPlayers))
    setTeamA([])
    setTeamB([])
    setPlayerFilter('')
  }

  const submitGame = async (e) => {
    e.preventDefault()
    
    if (teamA.length !== 6 || teamB.length !== 6) {
      setMessage('Each team must have exactly 6 players')
      return
    }

    if (!teamAScore || !teamBScore) {
      setMessage('Please enter scores for both teams')
      return
    }

    setLoading(true)

    const { data: seasonData } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_current', true)
      .single()

    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .insert([{
        season_id: seasonData.id,
        game_date: gameDate,
        team_a_score: parseInt(teamAScore),
        team_b_score: parseInt(teamBScore)
      }])
      .select()
      .single()

    if (gameError) {
      setMessage(`Error creating game: ${gameError.message}`)
      setLoading(false)
      return
    }

    const gamePlayers = [
      ...teamA.map(playerId => ({
        game_id: gameData.id,
        player_id: playerId,
        team: 'A'
      })),
      ...teamB.map(playerId => ({
        game_id: gameData.id,
        player_id: playerId,
        team: 'B'
      }))
    ]

    const { error: playersError } = await supabase
      .from('game_players')
      .insert(gamePlayers)

    if (playersError) {
      setMessage(`Error adding players: ${playersError.message}`)
    } else {
      setMessage('Game recorded successfully!')
      resetTeams()
      setTeamAScore('')
      setTeamBScore('')
      setGameDate(new Date().toISOString().split('T')[0])
    }

    setLoading(false)
    setTimeout(() => setMessage(''), 5000)
  }

  // Player card component
  const PlayerCard = ({ playerId, source }) => {
    const player = players.find(p => p.id === playerId)
    
    return (
      <div
        draggable="true"
        onDragStart={(e) => handleDragStart(e, playerId, source)}
        style={{ 
          display: 'inline-block',
          padding: '8px 12px',
          margin: '4px',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '6px',
          cursor: 'move',
          userSelect: 'none'
        }}
      >
        <span style={{ marginRight: '6px' }}>{getCountryFlag(player?.country)}</span>
        <span>{player?.name}</span>
        <span style={{ marginLeft: '8px' }}>
          {source === 'unassigned' && (
            <>
              {teamA.length < 6 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    movePlayer(playerId, source, 'teamA')
                  }}
                  style={{ 
                    fontSize: '16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 4px'
                  }}
                  title="Move to White Team"
                >
                  ⚪
                </button>
              )}
              {teamB.length < 6 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    movePlayer(playerId, source, 'teamB')
                  }}
                  style={{ 
                    fontSize: '16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 4px'
                  }}
                  title="Move to Black Team"
                >
                  ⚫
                </button>
              )}
            </>
          )}
          
          {source === 'teamA' && teamB.length < 6 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                movePlayer(playerId, source, 'teamB')
              }}
              style={{ 
                fontSize: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0 4px'
              }}
              title="Swap to Black Team"
            >
              ⇄
            </button>
          )}
          
          {source === 'teamB' && teamA.length < 6 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                movePlayer(playerId, source, 'teamA')
              }}
              style={{ 
                fontSize: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0 4px'
              }}
              title="Swap to White Team"
            >
              ⇄
            </button>
          )}
          
          {source !== 'unassigned' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                movePlayer(playerId, source, 'unassigned')
              }}
              style={{ 
                fontSize: '14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0 4px',
                opacity: 0.6
              }}
              title="Remove from team"
            >
              ⌫
            </button>
          )}
        </span>
      </div>
    )
  }

  const filteredPlayersForCountry = players.filter(player => 
    player.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

        {message && (
          <div className={`mb-4 p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* Add Player Section with Searchable Country Selection */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Add New Player</h2>
            <button
              onClick={() => setShowCountryManager(!showCountryManager)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {showCountryManager ? 'Hide' : 'Manage'} Player Countries 🌍
            </button>
          </div>
          
          <form onSubmit={addPlayer} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Player name"
              className="flex-1 px-3 py-2 border rounded"
              disabled={loading}
            />
            <div className="w-64">
              <CountryDropdown
                value={newPlayerCountry}
                onChange={setNewPlayerCountry}
                disabled={loading}
                placeholder="Select country (optional)..."
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Add Player
            </button>
          </form>
          
          {/* Preview */}
          {newPlayerName && (
            <div className="text-sm text-gray-600">
              Preview: {getCountryFlag(newPlayerCountry)} {newPlayerName}
            </div>
          )}
        </div>

        {/* Country Manager Section (toggleable) */}
        {showCountryManager && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Update Player Countries</h2>
            
            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                value={countrySearchTerm}
                onChange={(e) => setCountrySearchTerm(e.target.value)}
                placeholder="Search players..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Players List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {filteredPlayersForCountry.map(player => (
                <div key={player.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getCountryFlag(player.country)}</span>
                    <span className="font-medium">{player.name}</span>
                    {!player.country && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">No country</span>
                    )}
                  </div>

                  {editMode[player.id] ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-48">
                        <CountryDropdown
                          value={player.country || ''}
                          onChange={(countryCode) => updatePlayerCountry(player.id, countryCode)}
                          disabled={loading}
                          placeholder="Search country..."
                        />
                      </div>
                      <button
                        onClick={() => setEditMode({ ...editMode, [player.id]: false })}
                        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditMode({ ...editMode, [player.id]: true })}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Edit
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Record Game Section - keeping the same */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Record Game</h2>
            <div className="flex gap-2">
              <button
                onClick={autoAssignTeams}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                disabled={unassigned.length + teamA.length + teamB.length < 12}
              >
                🎲 Random Teams
              </button>
              <button
                onClick={resetTeams}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                ↺ Reset
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800 mb-4">
            💡 <strong>Quick buttons:</strong> ⚪ = White Team, ⚫ = Black Team, ⇄ = Swap teams, ⌫ = Remove | Or drag players between areas
          </div>

          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Team A (White) */}
            <div>
              <h3 className="font-semibold mb-2 text-lg">
                ⚪ Team A (White) - {teamA.length}/6
              </h3>
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'teamA')}
                style={{
                  border: '2px dashed #3B82F6',
                  borderRadius: '8px',
                  padding: '16px',
                  minHeight: '350px',
                  backgroundColor: '#EFF6FF'
                }}
              >
                {teamA.map(playerId => (
                  <PlayerCard key={playerId} playerId={playerId} source="teamA" />
                ))}
                {teamA.length === 0 && (
                  <div style={{ textAlign: 'center', marginTop: '100px', color: '#999' }}>
                    Drag players here or click ⚪
                  </div>
                )}
              </div>
              <input
                type="number"
                value={teamAScore}
                onChange={(e) => setTeamAScore(e.target.value)}
                placeholder="White Team Score"
                className="mt-2 w-full px-3 py-2 border rounded"
                min="0"
              />
            </div>

            {/* Unassigned Players */}
            <div>
              <h3 className="font-semibold mb-2 text-lg">
                Available Players ({unassigned.length})
              </h3>
              <textarea
                value={playerFilter}
                onChange={(e) => setPlayerFilter(e.target.value)}
                placeholder="Filter players... (paste multiple names on separate lines)"
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  minHeight: '40px',
                  maxHeight: '100px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'unassigned')}
                style={{
                  border: '2px dashed #9CA3AF',
                  borderRadius: '8px',
                  padding: '16px',
                  minHeight: '350px',
                  maxHeight: '450px',
                  overflowY: 'auto',
                  backgroundColor: '#F9FAFB'
                }}
              >
                {(() => {
                  const filteredPlayers = unassigned.filter(playerId => {
                    if (!playerFilter) return true
                    const player = players.find(p => p.id === playerId)
                    if (!player) return false
                    
                    const filterNames = playerFilter
                      .split('\n')
                      .map(name => name.trim().toLowerCase())
                      .filter(name => name.length > 0)
                    
                    if (filterNames.length === 0) return true
                    
                    const playerNameLower = player.name.toLowerCase()
                    
                    return filterNames.some(filterName => {
                      if (playerNameLower === filterName) {
                        return true
                      }
                      const exactMatchExists = unassigned.some(id => {
                        const p = players.find(pl => pl.id === id)
                        return p && p.name.toLowerCase() === filterName
                      })
                      
                      if (exactMatchExists) {
                        return false
                      }
                      
                      return playerNameLower.includes(filterName) || filterName.includes(playerNameLower)
                    })
                  })

                  return (
                    <>
                      {filteredPlayers.map(playerId => (
                        <PlayerCard key={playerId} playerId={playerId} source="unassigned" />
                      ))}
                      {filteredPlayers.length === 0 && (
                        <div style={{ textAlign: 'center', marginTop: '20px', color: '#999' }}>
                          {playerFilter ? 'No players match filter' : 'No available players'}
                        </div>
                      )}
                      {filteredPlayers.length > 0 && playerFilter && (
                        <div style={{
                          marginTop: '16px',
                          paddingTop: '16px',
                          borderTop: '1px solid #e5e7eb',
                          display: 'flex',
                          gap: '8px',
                          justifyContent: 'center'
                        }}>
                          <button
                            onClick={() => {
                              const toMove = filteredPlayers.slice(0, 6 - teamA.length)
                              setTeamA([...teamA, ...toMove])
                              setUnassigned(unassigned.filter(id => !toMove.includes(id)))
                              setPlayerFilter('')
                            }}
                            disabled={teamA.length >= 6}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: teamA.length >= 6 ? '#9ca3af' : '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: teamA.length >= 6 ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                          >
                            ⚪ Add All to White ({Math.min(filteredPlayers.length, 6 - teamA.length)})
                          </button>
                          <button
                            onClick={() => {
                              const toMove = filteredPlayers.slice(0, 6 - teamB.length)
                              setTeamB([...teamB, ...toMove])
                              setUnassigned(unassigned.filter(id => !toMove.includes(id)))
                              setPlayerFilter('')
                            }}
                            disabled={teamB.length >= 6}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: teamB.length >= 6 ? '#9ca3af' : '#000',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: teamB.length >= 6 ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                          >
                            ⚫ Add All to Black ({Math.min(filteredPlayers.length, 6 - teamB.length)})
                          </button>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Team B (Black) */}
            <div>
              <h3 className="font-semibold mb-2 text-lg">
                ⚫ Team B (Black) - {teamB.length}/6
              </h3>
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'teamB')}
                style={{
                  border: '2px dashed #000',
                  borderRadius: '8px',
                  padding: '16px',
                  minHeight: '350px',
                  backgroundColor: '#F5F5F5'
                }}
              >
                {teamB.map(playerId => (
                  <PlayerCard key={playerId} playerId={playerId} source="teamB" />
                ))}
                {teamB.length === 0 && (
                  <div style={{ textAlign: 'center', marginTop: '100px', color: '#999' }}>
                    Drag players here or click ⚫
                  </div>
                )}
              </div>
              <input
                type="number"
                value={teamBScore}
                onChange={(e) => setTeamBScore(e.target.value)}
                placeholder="Black Team Score"
                className="mt-2 w-full px-3 py-2 border rounded"
                min="0"
              />
            </div>
          </div>

          {/* Submit Button */}
          {teamA.length === 6 && teamB.length === 6 && (
            <>
              <div style={{ 
                marginBottom: '16px', 
                padding: '16px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <label style={{ fontWeight: '600', fontSize: '16px' }}>
                  Game Date:
                </label>
                <input
                  type="date"
                  value={gameDate}
                  onChange={(e) => setGameDate(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white'
                  }}
                />
                <span style={{ color: '#6b7280', fontSize: '14px' }}>
                  (Recording game for {new Date(gameDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })})
                </span>
              </div>
              
              <button
                onClick={submitGame}
                disabled={loading}
                className="w-full py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 font-semibold text-lg"
              >
                {loading ? 'Recording...' : '✓ Record Game'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}