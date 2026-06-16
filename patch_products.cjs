const fs = require('fs');
const path = 'src/pages/customer/Products.jsx';
let content = fs.readFileSync(path, 'utf8');

// Add useSearchParams
content = content.replace(
  "import { useEffect, useState } from 'react';",
  "import { useEffect, useState } from 'react';\nimport { useSearchParams } from 'react-router-dom';"
);

// Update state initialization
content = content.replace(
  "const [page, setPage] = useState(1);",
  "const [page, setPage] = useState(1);\n  const [searchParams, setSearchParams] = useSearchParams();"
);

content = content.replace(
  "const [filters, setFilters] = useState({\n    q: '',\n    category: '',\n    size: '',",
  "const [filters, setFilters] = useState({\n    q: searchParams.get('q') || '',\n    category: searchParams.get('category') || '',\n    size: searchParams.get('size') || '',"
);

content = content.replace(
  "const [searchQuery, setSearchQuery] = useState('');",
  "const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');"
);

// Update handleApplyFilters
content = content.replace(
  "setFilters(prev => ({\n      ...prev,\n      q: searchQuery,",
  "setSearchParams({ q: searchQuery, category: filters.category, size: filters.size });\n    setFilters(prev => ({\n      ...prev,\n      q: searchQuery,"
);

// Also need to trigger search when searchParams changes?
// Actually, it's better to just read on mount. 

fs.writeFileSync(path, content, 'utf8');
console.log('Products.jsx patched');
