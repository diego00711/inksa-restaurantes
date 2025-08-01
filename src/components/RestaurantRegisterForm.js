// src/components/RestaurantRegisterForm.jsx

import React, { useState } from 'react';
// Importaremos o AuthService quando formos conectar ao backend
// import AuthService from '../services/authService';

// Estilos CSS em um objeto JavaScript.
const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '600px',
    margin: '2rem auto',
    padding: '2rem',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: 'white',
  },
  input: {
    marginBottom: '1rem',
    padding: '8px',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  label: {
    marginBottom: '0.5rem',
    fontWeight: 'bold',
  },
  button: {
    padding: '10px 15px',
    fontSize: '1rem',
    backgroundColor: '#f97316', // Laranja do Inksa
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  h2: {
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
    marginBottom: '1rem',
  }
};

export function RestaurantRegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'restaurant',
    profileData: {
      restaurantName: '',
      businessName: '',
      cnpj: '',
      phone: '',
      addressStreet: '',
      addressNumber: '',
      addressNeighborhood: '',
      addressCity: '',
      addressState: '',
      addressZipcode: '',
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name in formData.profileData) {
      setFormData(prevState => ({
        ...prevState,
        profileData: {
          ...prevState.profileData,
          [name]: value,
        },
      }));
    } else {
      setFormData(prevState => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Dados do formulário prontos para enviar:");
    console.log(JSON.stringify(formData, null, 2));
    
    // TODO: Quando a API estiver funcionando, a chamada ao AuthService será feita aqui.
    alert('Interface funcionando! Verifique o console (F12) para ver os dados coletados.');
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2 style={styles.h2}>Cadastro de Restaurante</h2>

      <label style={styles.label} htmlFor="email">Email de Acesso</label>
      <input style={styles.input} type="email" name="email" id="email" value={formData.email} onChange={handleChange} required />

      <label style={styles.label} htmlFor="password">Senha</label>
      <input style={styles.input} type="password" name="password" id="password" value={formData.password} onChange={handleChange} required />

      <h2 style={styles.h2}>Perfil do Restaurante</h2>
      
      <label style={styles.label} htmlFor="restaurantName">Nome do Restaurante</label>
      <input style={styles.input} type="text" name="restaurantName" id="restaurantName" value={formData.profileData.restaurantName} onChange={handleChange} required />
      
      <label style={styles.label} htmlFor="businessName">Razão Social</label>
      <input style={styles.input} type="text" name="businessName" id="businessName" value={formData.profileData.businessName} onChange={handleChange} />
      
      <label style={styles.label} htmlFor="cnpj">CNPJ</label>
      <input style={styles.input} type="text" name="cnpj" id="cnpj" value={formData.profileData.cnpj} onChange={handleChange} required />
      
      <label style={styles.label} htmlFor="phone">Telefone de Contato</label>
      <input style={styles.input} type="text" name="phone" id="phone" value={formData.profileData.phone} onChange={handleChange} required />

      <h2 style={styles.h2}>Endereço</h2>

      <label style={styles.label} htmlFor="addressStreet">Rua</label>
      <input style={styles.input} type="text" name="addressStreet" id="addressStreet" value={formData.profileData.addressStreet} onChange={handleChange} required />
      
      <label style={styles.label} htmlFor="addressNumber">Número</label>
      <input style={styles.input} type="text" name="addressNumber" id="addressNumber" value={formData.profileData.addressNumber} onChange={handleChange} required />

      <label style={styles.label} htmlFor="addressNeighborhood">Bairro</label>
      <input style={styles.input} type="text" name="addressNeighborhood" id="addressNeighborhood" value={formData.profileData.addressNeighborhood} onChange={handleChange} required />
      
      <label style={styles.label} htmlFor="addressCity">Cidade</label>
      <input style={styles.input} type="text" name="addressCity" id="addressCity" value={formData.profileData.addressCity} onChange={handleChange} required />
      
      <label style={styles.label} htmlFor="addressState">Estado (UF)</label>
      <input style={styles.input} type="text" name="addressState" id="addressState" maxLength="2" value={formData.profileData.addressState} onChange={handleChange} required />
      
      <label style={styles.label} htmlFor="addressZipcode">CEP</label>
      <input style={styles.input} type="text" name="addressZipcode" id="addressZipcode" value={formData.profileData.addressZipcode} onChange={handleChange} required />
      
      <button style={styles.button} type="submit">Cadastrar Restaurante</button>
    </form>
  );
};