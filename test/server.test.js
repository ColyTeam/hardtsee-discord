import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { InteractionResponseType, InteractionType } from 'discord-interactions';
import { HARDTSEE_COMMAND } from '../src/commands.js';
import sinon from 'sinon';
import server from '../src/server.js';
import { scubwUrl } from '../src/hardtsee.js';

describe('Server', () => {
  describe('GET /', () => {
    it('should return a greeting message with the Discord application ID', async () => {
      const request = {
        method: 'GET',
        url: new URL('/', 'http://discordo.example'),
      };
      const env = { DISCORD_APPLICATION_ID: '123456789' };

      const response = await server.fetch(request, env);
      const body = await response.text();

      expect(body).to.equal('👋 123456789');
    });
  });

  describe('POST /', () => {
    let verifyDiscordRequestStub;

    beforeEach(() => {
      verifyDiscordRequestStub = sinon.stub(server, 'verifyDiscordRequest');
    });

    afterEach(() => {
      verifyDiscordRequestStub.restore();
    });

    it('should handle a PING interaction', async () => {
      const interaction = {
        type: InteractionType.PING,
      };

      const request = {
        method: 'POST',
        url: new URL('/', 'http://discordo.example'),
      };

      const env = {};

      verifyDiscordRequestStub.resolves({
        isValid: true,
        interaction: interaction,
      });

      const response = await server.fetch(request, env);
      const body = await response.json();
      expect(body.type).to.equal(InteractionResponseType.PONG);
    });

    it('should handle an hardtsee command interaction', async () => {
      const interaction = {
        type: InteractionType.APPLICATION_COMMAND,
        data: {
          name: HARDTSEE_COMMAND.name,
        },
      };

      const request = {
        method: 'POST',
        url: new URL('/', 'http://discordo.example'),
      };

      const env = {};

      verifyDiscordRequestStub.resolves({
        isValid: true,
        interaction: interaction,
      });

      // mock the fetch call to scubw
      const result = sinon
        // eslint-disable-next-line no-undef
        .stub(global, 'fetch')
        .withArgs(scubwUrl)
        .resolves({
          status: 200,
          ok: true,
          json: sinon.fake.resolves({ data: { children: [] } }),
        });

      const response = await server.fetch(request, env);
      const body = await response.json();
      expect(body.type).to.equal(
        InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      );
      expect(result.calledOnce);
    });

    it('should handle an unknown command interaction', async () => {
      const interaction = {
        type: InteractionType.APPLICATION_COMMAND,
        data: {
          name: 'unknown',
        },
      };

      const request = {
        method: 'POST',
        url: new URL('/', 'http://discordo.example'),
      };

      verifyDiscordRequestStub.resolves({
        isValid: true,
        interaction: interaction,
      });

      const response = await server.fetch(request, {});
      const body = await response.json();
      expect(response.status).to.equal(400);
      expect(body.error).to.equal('Unknown Type');
    });
  });

  describe('All other routes', () => {
    it('should return a "Not Found" response', async () => {
      const request = {
        method: 'GET',
        url: new URL('/unknown', 'http://discordo.example'),
      };
      const response = await server.fetch(request, {});
      expect(response.status).to.equal(404);
      const body = await response.text();
      expect(body).to.equal('Not Found.');
    });
  });
});
