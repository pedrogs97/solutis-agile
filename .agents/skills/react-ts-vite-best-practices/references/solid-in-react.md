# Aplicação dos Princípios SOLID no React + TypeScript

Os princípios SOLID garantem que seus componentes React sejam modularizados, desacoplados, altamente testáveis e fáceis de manter.

---

## 1. Single Responsibility Principle (SRP) - Princípio da Responsabilidade Única

> *Um componente ou módulo deve ter apenas uma razão para mudar.*

### ❌ Anti-padrão (Componente "Deus" misturando UI, busca de dados, estado e formatação):

```tsx
// UserProfile.tsx - VIOLAÇÃO DO SRP
export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div>Carregando...</div>;

  const formattedDate = new Date(user.createdAt).toLocaleDateString('pt-BR');

  return (
    <div className="card">
      <h2>{user.name.toUpperCase()}</h2>
      <p>Email: {user.email}</p>
      <p>Membro desde: {formattedDate}</p>
    </div>
  );
}
```

### ✅ Forma Correta (Separação entre Serviço, Custom Hook e Presenter):

```tsx
// 1. Camada de Serviço (service/userService.ts)
export async function getUserById(userId: string): Promise<User> {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) throw new Error('Falha ao buscar usuário');
  return response.json();
}

// 2. Custom Hook de Lógica de Negócio e Estado (hooks/useUser.ts)
export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getUserById(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [userId]);

  return { user, isLoading, error };
}

// 3. Componente Presentacional / UI (components/UserProfile.tsx)
interface UserProfileProps {
  userId: string;
}

export function UserProfile({ userId }: UserProfileProps) {
  const { user, isLoading, error } = useUser(userId);

  if (isLoading) return <Spinner />;
  if (error || !user) return <ErrorMessage message="Erro ao carregar usuário" />;

  return <UserCardView user={user} />;
}
```

---

## 2. Open/Closed Principle (OCP) - Princípio do Aberto/Fechado

> *Entidades de software devem estar abertas para extensão, mas fechadas para modificação.*

### ❌ Anti-padrão (Modificar o componente interno com vários `if/else` para novos casos de uso):

```tsx
// Modal.tsx - VIOLAÇÃO DO OCP
export function Modal({ type, title, text }: { type: 'alert' | 'confirm' | 'form'; title: string; text?: string }) {
  return (
    <div className="modal">
      <h3>{title}</h3>
      {type === 'alert' && <p>{text}</p>}
      {type === 'confirm' && (
        <div>
          <button>Cancelar</button>
          <button>Confirmar</button>
        </div>
      )}
      {type === 'form' && <input placeholder="Digite algo" />}
    </div>
  );
}
```

### ✅ Forma Correta (Composição via `children` ou Slot Pattern):

```tsx
// Modal.tsx - ABERTO PARA EXTENSÃO VIA COMPOSIÇÃO
interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Modal({ title, isOpen, onClose, children, actions }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <header className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose}>&times;</button>
        </header>
        <div className="modal-body">{children}</div>
        {actions && <footer className="modal-footer">{actions}</footer>}
      </div>
    </div>
  );
}

// Exemplo de Extensão sem Alterar o Modal Base:
export function ConfirmDialog({ isOpen, onClose, onConfirm }: ConfirmDialogProps) {
  return (
    <Modal
      title="Confirmar Ação"
      isOpen={isOpen}
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={onConfirm}>Confirmar</Button>
        </>
      }
    >
      <p>Tem certeza que deseja prosseguir com esta operação?</p>
    </Modal>
  );
}
```

---

## 3. Liskov Substitution Principle (LSP) - Princípio da Substituição de Liskov

> *Subtipos devem ser substituíveis por seus tipos de base sem alterar a corretude do programa.*

### ✅ Aplicado a Componentes Reutilizáveis de UI:

Um componente `Button` customizado deve ser um substituto perfeito de um elemento `<button>` HTML nativo, herdando todas as suas propriedades nativas via `React.ComponentPropsWithRef<'button'>`.

```tsx
// components/ui/Button.tsx
import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ComponentPropsWithRef<'button'> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', isLoading, children, disabled, className = '', ...restProps }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`btn btn-${variant} ${className}`}
        {...restProps} // Garante compatibilidade total com onClick, type, aria-*, etc.
      >
        {isLoading ? <Spinner size="sm" /> : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

---

## 4. Interface Segregation Principle (ISP) - Princípio da Segregação de Interface

> *Nenhum cliente deve ser forçado a depender de métodos ou propriedades que não utiliza.*

### ❌ Anti-padrão (Passar o objeto do usuário completo para um componente que só precisa do nome e avatar):

```tsx
// Avatar.tsx - VIOLAÇÃO DO ISP
interface UserFullData {
  id: string;
  name: string;
  avatarUrl: string;
  email: string;
  address: string;
  permissions: string[];
  billingHistory: any[];
}

export function UserAvatar({ user }: { user: UserFullData }) {
  return <img src={user.avatarUrl} alt={user.name} />;
}
```

### ✅ Forma Correta (Interface mínima e específica):

```tsx
// Avatar.tsx - SEGREGADO E REUTILIZÁVEL
interface UserAvatarProps {
  name: string;
  avatarUrl: string;
  size?: 'sm' | 'md' | 'lg';
}

export function UserAvatar({ name, avatarUrl, size = 'md' }: UserAvatarProps) {
  return <img src={avatarUrl} alt={name} className={`avatar avatar-${size}`} />;
}
```

---

## 5. Dependency Inversion Principle (DIP) - Princípio da Inversão de Dependência

> *Módulos de alto nível não devem depender de módulos de baixo nível. Ambos devem depender de abstrações.*

### ❌ Anti-padrão (Importação e acoplamento direto com Axios ou Fetch dentro do componente):

```tsx
import axios from 'axios';

export function AnalyticsWidget() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get('/api/analytics').then((res) => setData(res.data));
  }, []);

  return <div>...</div>;
}
```

### ✅ Forma Correta (Injeção via Abstrações/Hooks/Services):

```tsx
// 1. Definir o contrato do cliente HTTP ou Provider de Dados
export interface IAnalyticsService {
  fetchMetrics(): Promise<MetricsData>;
}

// 2. Custom Hook que depende de uma abstração de dados (pode ser mockado facilmente nos testes)
export function useAnalytics(service: IAnalyticsService = defaultAnalyticsService) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);

  useEffect(() => {
    service.fetchMetrics().then(setMetrics);
  }, [service]);

  return { metrics };
}
```
