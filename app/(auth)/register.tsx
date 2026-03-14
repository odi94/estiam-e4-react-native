import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { Colors } from '@/constants/theme';

export default function RegisterScreen() {
  const { register, isLoading, error } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validate = () => {
    let newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }

    if (!emailRegex.test(email)) {
      newErrors.email = 'Email invalide';
    }

    if (password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);

    return !Object.values(newErrors).some(e => e !== '');
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      await register({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });
    } catch (err) {
      console.log('Register error handled');
    }
  };

  const renderError = (message: string) =>
    message ? <Text style={styles.fieldError}>{message}</Text> : null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🍔</Text>
            <Text style={styles.title}>Créer un compte</Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <View
                  style={[
                    styles.inputContainer,
                    errors.firstName && styles.inputError,
                  ]}
                >
                  <User size={20} color="#999" />
                  <TextInput
                    style={styles.input}
                    placeholder="Prénom"
                    value={firstName}
                    onChangeText={setFirstName}
                    editable={!isLoading}
                  />
                </View>
                {renderError(errors.firstName)}
              </View>

              <View style={{ flex: 1 }}>
                <View
                  style={[
                    styles.inputContainer,
                    errors.lastName && styles.inputError,
                  ]}
                >
                  <User size={20} color="#999" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nom"
                    value={lastName}
                    onChangeText={setLastName}
                    editable={!isLoading}
                  />
                </View>
                {renderError(errors.lastName)}
              </View>
            </View>

            <View>
              <View
                style={[
                  styles.inputContainer,
                  errors.email && styles.inputError,
                ]}
              >
                <Mail size={20} color="#999" />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
              {renderError(errors.email)}
            </View>

            <View>
              <View style={styles.inputContainer}>
                <Phone size={20} color="#999" />
                <TextInput
                  style={styles.input}
                  placeholder="Téléphone (optionnel)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View>
              <View
                style={[
                  styles.inputContainer,
                  errors.password && styles.inputError,
                ]}
              >
                <Lock size={20} color="#999" />
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#999" />
                  ) : (
                    <Eye size={20} color="#999" />
                  )}
                </TouchableOpacity>
              </View>
              {renderError(errors.password)}
            </View>

            <View>
              <View
                style={[
                  styles.inputContainer,
                  errors.confirmPassword && styles.inputError,
                ]}
              >
                <Lock size={20} color="#999" />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmer mot de passe"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
              </View>
              {renderError(errors.confirmPassword)}
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Créer mon compte</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <Text style={styles.loginText}>
              Déjà un compte ?{' '}
              <Text style={styles.loginTextBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },

  logo: {
    fontSize: 48,
    marginBottom: 8,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },

  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },

  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },

  form: {
    width: '100%',
  },

  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 6,
    paddingHorizontal: 16,
    gap: 12,
  },

  inputError: {
    borderWidth: 1,
    borderColor: '#D32F2F',
  },

  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000',
  },

  fieldError: {
    color: '#D32F2F',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },

  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  loginButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 16,
  },

  loginText: {
    color: '#666',
    fontSize: 14,
  },

  loginTextBold: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
});