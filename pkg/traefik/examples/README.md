# Traefik Middleware Examples

This directory contains various examples of Traefik Middleware configurations to demonstrate how different types of middlewares work, both individually and in combination.

## Single Type Middlewares

### Authentication
- `middleware-basic-auth.yaml` - Basic HTTP Authentication
- `middleware-forward-auth.yaml` - Forward Authentication to external service

### Traffic Management
- `middleware-rate-limit.yaml` - Rate limiting per client
- `middleware-ip-whitelist.yaml` - IP-based access control
- `middleware-retry.yaml` - Automatic retry on failures
- `middleware-circuit-breaker.yaml` - Circuit breaker pattern

### Request/Response Manipulation
- `middleware-headers.yaml` - Custom headers management
- `middleware-strip-prefix.yaml` - Remove path prefixes
- `middleware-redirect-scheme.yaml` - HTTP to HTTPS redirect
- `middleware-compress.yaml` - Response compression

## Combination Middlewares

### Two Types Combined
- `middleware-combo-auth-rate.yaml` - Basic Auth + Rate Limiting
- `middleware-combo-headers-compress.yaml` - Custom Headers + Compression
- `middleware-combo-strip-redirect.yaml` - Strip Prefix + HTTPS Redirect

### Multiple Types Combined
- `middleware-combo-triple.yaml` - Forward Auth + Rate Limiting + IP Whitelist
- `middleware-combo-complex.yaml` - Headers + Rate Limiting + Compression + Retry

## How to Use

1. Apply the middleware resources:
   ```bash
   kubectl apply -f middleware-basic-auth.yaml
   ```

2. Reference the middleware in your IngressRoute:
   ```yaml
   spec:
     routes:
     - match: Host(`example.com`)
       kind: Rule
       services:
       - name: my-service
         port: 80
       middlewares:
       - name: basic-auth-middleware
   ```

## Viewing in Rancher UI

When viewing these middlewares in the Rancher UI list view, you'll see:
- Single type middlewares display one type (e.g., "Basic Authentication")
- Combined middlewares display multiple types separated by commas (e.g., "Basic Authentication, Rate Limiting")
- Hovering over combined middlewares shows a tooltip with all types listed

## Notes

- All examples use the `default` namespace, adjust as needed
- Secret references (like in basic-auth) need to be created separately
- Service references in forward-auth should point to actual services
- IP ranges in ip-whitelist should match your network configuration