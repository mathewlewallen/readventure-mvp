import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';

@Injectable()
export class AlertConfig {
  constructor(private configService: ConfigService) {}

  private readonly alertThresholds = {
    errorRate: 0.05, // 5% error rate threshold
    responseTime: 1000, // 1 second response time threshold
    memoryUsage: 0.9, // 90% memory usage threshold
  };

  private readonly alertChannels = {
    slack: this.configService.get<string>('SLACK_WEBHOOK_URL'),
    email: this.configService.get<string>('ALERT_EMAIL'),
  };

  async sendAlert(type: string, message: string, data?: any) {
    // Send to Sentry
    Sentry.captureMessage(message, 'error');

    // Send to Slack
    if (this.alertChannels.slack) {
      await fetch(this.alertChannels.slack, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Alert: ${type}\n${message}\n${JSON.stringify(data, null, 2)}`,
        }),
      });
    }

    // Log locally
    console.error({
      type,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  checkThresholds(metrics: {
    errorCount: number;
    totalRequests: number;
    averageResponseTime: number;
    memoryUsage: number;
  }) {
    const { errorCount, totalRequests, averageResponseTime, memoryUsage } =
      metrics;

    if (errorCount / totalRequests > this.alertThresholds.errorRate) {
      this.sendAlert(
        'High Error Rate',
        `Error rate exceeded threshold: ${((errorCount / totalRequests) * 100).toFixed(2)}%`,
      );
    }

    if (averageResponseTime > this.alertThresholds.responseTime) {
      this.sendAlert(
        'High Response Time',
        `Average response time exceeded threshold: ${averageResponseTime}ms`,
      );
    }

    if (memoryUsage > this.alertThresholds.memoryUsage) {
      this.sendAlert(
        'High Memory Usage',
        `Memory usage exceeded threshold: ${(memoryUsage * 100).toFixed(2)}%`,
      );
    }
  }
}
