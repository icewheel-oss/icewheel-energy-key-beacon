/*
 * IceWheel Energy
 * Copyright (C) 2025 IceWheel LLC
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

'use client';

import { useState } from 'react';
import { Card, Button, Form, Alert, Row, Col, InputGroup } from 'react-bootstrap';

interface HomePageClientProps {
  publicKey: string | undefined;
}

// Define a more specific type for the API result
interface Result {
  status: 'fulfilled' | 'rejected';
  value: {
    region: string;
    data?: Record<string, unknown>;
    url?: string;
  };
  reason?: {
    message: string;
  };
}

// A single result card component for displaying API responses
const ResultCard = ({ result }: { result: Result }) => {
  const isSuccess = result.status === 'fulfilled';
  const variant = isSuccess ? 'success' : 'danger';
  const title = isSuccess ? `✅ ${result.value.region.toUpperCase()}: Success` : `❌ ${result.value.region.toUpperCase()}: Failed`;
  const data = isSuccess ? result.value.data : { error: result.reason?.message };

  return (
    <Alert variant={variant} className="mt-4">
      <Alert.Heading>{title}</Alert.Heading>
      {result.value.url && <p className="text-muted text-xs">Request URL: {result.value.url}</p>}
      <pre className="text-xs whitespace-pre-wrap break-all">{JSON.stringify(data, null, 2)}</pre>
    </Alert>
  );
};

export default function HomePageClient({ publicKey }: HomePageClientProps) {
  // State for Verification
  const [verifyDomain, setVerifyDomain] = useState('');
  const [verifyRegions, setVerifyRegions] = useState({ na: true, eu: true });
  const [verifyResult, setVerifyResult] = useState<Result[]>([]);
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // State for Registration
  const [registerDomain, setRegisterDomain] = useState('');
  const [registerRegions, setRegisterRegions] = useState({ na: true, eu: true });
  const [registerResult, setRegisterResult] = useState<Result[]>([]);
  const [registerError, setRegisterError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // State for token generation
  const [tokenClientId, setTokenClientId] = useState('');
  const [tokenClientSecret, setTokenClientSecret] = useState('');
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [tokenError, setTokenError] = useState('');

  // Shared Token State
  const [partnerToken, setPartnerToken] = useState('');

  // Help and Copy state
  const [showHelp, setShowHelp] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copy');

  const handleRegionChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<{na: boolean, eu: boolean}>>) => {
    const { name, checked } = e.target;
    setter(prev => ({ ...prev, [name]: checked }));
  };

  const vnCurlCommand = `curl --request POST \
  --url 'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode 'client_id=YOUR_CLIENT_ID' \
  --data-urlencode 'client_secret=YOUR_CLIENT_SECRET' \
  --data-urlencode 'scope=openid user_data vehicle_device_data vehicle_cmds vehicle_charging_cmds energy_device_data energy_cmds offline_access' \
  --data-urlencode 'audience=https://fleet-api.prd.na.vn.cloud.tesla.com'`;

  const handleCopy = (command: string) => {
    const singleLineCommand = command.replace(/ \n/g, ' ');
    navigator.clipboard.writeText(singleLineCommand);
    setCopyButtonText('Copied!');
    setTimeout(() => setCopyButtonText('Copy'), 2000);
  };

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingToken(true);
    setTokenError('');
    try {
      const response = await fetch('/api/get-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: tokenClientId, clientSecret: tokenClientSecret }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');
      setPartnerToken(data.access_token);
    } catch (err) {
      if (err instanceof Error) {
        setTokenError(err.message);
      } else {
        setTokenError('An unknown error occurred');
      }
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedRegions = (Object.keys(verifyRegions) as Array<keyof typeof verifyRegions>).filter(r => verifyRegions[r]);
    if (selectedRegions.length === 0) {
      setVerifyError('Please select at least one region.');
      return;
    }
    setIsVerifying(true);
    setVerifyError('');
    setVerifyResult([]);
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: verifyDomain, token: partnerToken, regions: selectedRegions }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');
      setVerifyResult(data);
    } catch (err) {
      if (err instanceof Error) {
        setVerifyError(err.message);
      } else {
        setVerifyError('An unknown error occurred');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedRegions = (Object.keys(registerRegions) as Array<keyof typeof registerRegions>).filter(r => registerRegions[r]);
    if (selectedRegions.length === 0) {
      setRegisterError('Please select at least one region.');
      return;
    }
    setIsRegistering(true);
    setRegisterError('');
    setRegisterResult([]);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: registerDomain, token: partnerToken, regions: selectedRegions }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');
      setRegisterResult(data);
    } catch (err) {
      if (err instanceof Error) {
        setRegisterError(err.message);
      } else {
        setRegisterError('An unknown error occurred');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const RegionCheckboxes = ({ regions, onChange }: { regions: {na: boolean, eu: boolean}, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="d-flex gap-4 mb-4">
      <Form.Check type="checkbox" name="na" label="North America" checked={regions.na} onChange={onChange} />
      <Form.Check type="checkbox" name="eu" label="Europe" checked={regions.eu} onChange={onChange} />
    </div>
  );

  return (
    <div>
      <div className="text-center">
        <h1><i className="bi bi-lightning-charge-fill"></i> Icewheel Energy Key Beacon</h1>
        <p className="lead text-muted">A utility to host a public key and interact with the Tesla Fleet API.</p>
      </div>

      <Row>
        <Col md={10} lg={8} className="mx-auto">
          <div className="g-4">
            <Card className="mb-4">
              <Card.Header as="h2"><i className="bi bi-key"></i> 1. Your Public Key</Card.Header>
              <Card.Body>
                {publicKey ? (
                  <>
                    <p>The app is serving this public key at <a href="/.well-known/appspecific/com.tesla.3p.public-key.pem">/.well-known/appspecific/com.tesla.3p.public-key.pem</a></p>
                    <pre className="bg-light p-3 rounded">{publicKey.replace(/\n/g, '\n')}</pre>
                  </>
                ) : (
                  <Alert variant="warning">
                    <Alert.Heading>Not Configured</Alert.Heading>
                    <p>The `TESLA_PUBLIC_KEY` environment variable is not set.</p>
                  </Alert>
                )}
              </Card.Body>
            </Card>

            {showHelp && (
              <Card className="mb-4">
                <Card.Header as="h3">How to Generate a Partner Token</Card.Header>
                <Card.Body>
                  <p>Generate a token using the `curl` command.</p>
                  <h5>Token:</h5>
                  <InputGroup className="mb-3">
                    <pre className="bg-dark text-white p-3 rounded w-100">{vnCurlCommand}</pre>
                    <Button variant="outline-secondary" onClick={() => handleCopy(vnCurlCommand)}><i className="bi bi-clipboard"></i> {copyButtonText}</Button>
                  </InputGroup>
                  <hr />
                  <h5>Generate Token via Form:</h5>
                  <Form onSubmit={handleGenerateToken}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="token_client_id">
                          <Form.Label>Client ID</Form.Label>
                          <Form.Control type="text" value={tokenClientId} onChange={(e) => setTokenClientId(e.target.value)} required />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="token_client_secret">
                          <Form.Label>Client Secret</Form.Label>
                          <Form.Control type="password" value={tokenClientSecret} onChange={(e) => setTokenClientSecret(e.target.value)} required />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Button variant="primary" type="submit" disabled={isGeneratingToken} className="w-100">
                      {isGeneratingToken ? 'Generating...' : 'Generate Token'}
                    </Button>
                    {tokenError && <Alert variant="danger" className="mt-4">{tokenError}</Alert>}
                  </Form>
                </Card.Body>
              </Card>
            )}
            

            <Card className="mb-4">
              <Card.Header as="h2"><i className="bi bi-shield-lock"></i> 2. Partner Authentication Token</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3" controlId="partner_token">
                  <div className="d-flex justify-content-between">
                    <Form.Label>Token</Form.Label>
                    <Button variant="link" size="sm" onClick={() => setShowHelp(!showHelp)}>{showHelp ? 'Hide Help' : 'Get Token Help'}</Button>
                  </div>
                  <Form.Control type="password" value={partnerToken} onChange={(e) => setPartnerToken(e.target.value)} required />
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="mb-4">
              <Card.Header as="h2"><i className="bi bi-card-checklist"></i> 3. Register Your Domain</Card.Header>
              <Card.Body>
                <Form onSubmit={handleRegisterSubmit}>
                  <RegionCheckboxes regions={registerRegions} onChange={(e) => handleRegionChange(e, setRegisterRegions)} />
                  <Form.Group className="mb-3" controlId="register_domain">
                    <Form.Label>Domain to Register</Form.Label>
                    <Form.Control type="text" value={registerDomain} onChange={(e) => setRegisterDomain(e.target.value)} required />
                  </Form.Group>
                  <Button variant="primary" type="submit" disabled={isRegistering} className="w-100">
                    {isRegistering ? 'Registering...' : <><i className="bi bi-arrow-right-circle"></i> Register Domain(s)</>}
                  </Button>
                </Form>
                {registerResult.length > 0 && <div className="mt-4">{registerResult.map((res, i) => <ResultCard key={i} result={res} />)}</div>}
                {registerError && <Alert variant="danger" className="mt-4">{registerError}</Alert>}
              </Card.Body>
            </Card>

            <Card className="mb-4">
              <Card.Header as="h2"><i className="bi bi-patch-check"></i> 4. Verify Registration</Card.Header>
              <Card.Body>
                <Form onSubmit={handleVerifySubmit}>
                  <RegionCheckboxes regions={verifyRegions} onChange={(e) => handleRegionChange(e, setVerifyRegions)} />
                  <Form.Group className="mb-3" controlId="verify_domain">
                    <Form.Label>Domain to Verify</Form.Label>
                    <Form.Control type="text" value={verifyDomain} onChange={(e) => setVerifyDomain(e.target.value)} required />
                  </Form.Group>
                  <Button variant="primary" type="submit" disabled={isVerifying} className="w-100">
                    {isVerifying ? 'Verifying...' : <><i className="bi bi-arrow-right-circle"></i> Verify Domain(s)</>}
                  </Button>
                </Form>
                {verifyResult.length > 0 && <div className="mt-4">{verifyResult.map((res, i) => <ResultCard key={i} result={res} />)}</div>}
                {verifyError && <Alert variant="danger" className="mt-4">{verifyError}</Alert>}
              </Card.Body>
            </Card>

            <Card bg="light" className="mb-4">
              <Card.Header as="h2"><i className="bi bi-info-circle"></i> Important: Tesla App Configuration</Card.Header>
              <Card.Body>
                <Card.Text>In your Tesla Developer Portal, you must add URLs for <strong>both</strong> your local computer and your final deployed app.</Card.Text>
                <h5>Allowed Origin(s):</h5>
                <ul>
                  <li>`http://localhost:8081`</li>
                  <li>`https://your-final-cloud-run-url.a.run.app` (replace with your actual URL)</li>
                </ul>
                <h5>Allowed Redirect URI(s):</h5>
                <ul>
                  <li>`http://localhost:8081/api/tesla/fleet/auth/callback`</li>
                  <li>`https://your-final-cloud-run-url.a.run.app/api/tesla/fleet/auth/callback`</li>
                </ul>
                <h5>Allowed Returned URL(s):</h5>
                <ul>
                  <li>`http://localhost:8081`</li>
                  <li>`https://your-final-cloud-run-url.a.run.app` (replace with your actual URL)</li>
                </ul>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
}
