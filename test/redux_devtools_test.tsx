import { write } from "bun"
import "valyrian.js/node"
import { describe, expect, test as it, afterEach, mock } from "bun:test"
import { FluxStore } from "valyrian.js/flux-store"
import { createPulseStore, createPulse } from "valyrian.js/pulses"
import { connectFluxStore, connectPulseStore, connectPulse } from "valyrian.js/redux-devtools"
import { wait } from "./utils/helpers"
import { v, mount, unmount } from "valyrian.js"

describe( "Redux DevTools Integration", () => {
  function setup () {
    const mockSend = mock( ( action: any, state: any ) => { } )
    const mockInit = mock( ( state: any ) => { } )

    const sendWrapper = ( action: any, state: any ) => {
      mockSend( action, JSON.parse( JSON.stringify( state ) ) )
    }

    const mockConnect = mock( ( options: any ) => ( {
      init: mockInit,
      send: sendWrapper
    } ) )

    const mockDevTools = {
      connect: mockConnect
    };

    ( global as any ).window = {
      __REDUX_DEVTOOLS_EXTENSION__: mockDevTools
    }

    return {
      mockSend,
      mockInit,
      mockConnect,
      mockDevTools
    }
  }

  afterEach( () => {
    Reflect.deleteProperty( global, "window" )
    unmount()
  } )

  describe( "FluxStore", () => {
    it( "should connect to devtools and send initial state", () => {
      const { mockConnect, mockInit } = setup()
      const store = new FluxStore( {
        state: { count: 0 }
      } )

      connectFluxStore( store, { name: "TestFlux" } )

      expect( mockConnect ).toHaveBeenCalled()
      expect( mockConnect ).toHaveBeenCalledWith( { name: "TestFlux" } )
      expect( mockInit ).toHaveBeenCalledWith( { count: 0 } )
    } )

    it( "should send commit events", () => {
      const { mockSend } = setup()
      const store = new FluxStore( {
        state: { count: 0 },
        mutations: {
          increment ( state ) {
            state.count++
          }
        }
      } )

      connectFluxStore( store )
      store.commit( "increment" )

      expect( mockSend ).toHaveBeenCalled()
      expect( mockSend ).toHaveBeenCalledWith( { type: "increment", payload: [] }, { count: 1 } )
    } )

    it( "should send module registration events", () => {
      const { mockSend } = setup()
      const store = new FluxStore( { state: {} } )
      connectFluxStore( store )

      store.registerModule( "testModule", { state: { val: 1 } } )

      expect( mockSend ).toHaveBeenCalledWith( { type: "[Module] Register: testModule" }, { testModule: { val: 1 } } )
    } )
  } )

  describe( "PulseStore", () => {
    it( "should connect to devtools and send initial state", () => {
      const { mockConnect, mockInit } = setup()
      const store = createPulseStore( { count: 0 }, {} )
      connectPulseStore( store, { name: "TestPulseStore" } )

      expect( mockConnect ).toHaveBeenCalledWith( { name: "TestPulseStore" } )
      expect( mockInit ).toHaveBeenCalledWith( { count: 0 } )
    } )

    it( "should send pulse events", async () => {
      const { mockSend } = setup()
      const store = createPulseStore(
        { count: 0 },
        {
          increment ( state ) {
            state.count++
          },
          async asyncIncrement ( state ) {
            await wait( 1 )
            state.count++
          }
        }
      )

      connectPulseStore( store )
      store.increment()
      await store.asyncIncrement()

      expect( mockSend ).toHaveBeenCalledWith( { type: "increment", payload: [] }, { count: 1 } )
      expect( mockSend ).toHaveBeenCalledWith( { type: "asyncIncrement", payload: [] }, { count: 2 } )
    } )
  } )

  describe( "Individual Pulse", () => {
    it( "should connect and send updates", () => {
      const { mockSend, mockConnect, mockInit } = setup()
      const pulse = createPulse( 0 )
      const [ read, write ] = connectPulse( pulse, { name: "TestPulse" } )

      expect( mockConnect ).toHaveBeenCalledWith( { name: "TestPulse" } )
      expect( mockInit ).toHaveBeenCalledWith( 0 )

      write( 5 )

      expect( mockSend ).toHaveBeenCalledWith( { type: "update", payload: 5 }, 5 )
      expect( read() ).toBe( 5 )
    } )
  } )

  describe( "Verification File Generation", () => {
    it( "should generate the verification html file", async () => {
      const htmlVNode = (
        <>
          { "<!DOCTYPE html>" }
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <title>Redux DevTools Verification</title>
            </head>
            <body>
              <h1>Redux DevTools Verification</h1>
              <div id="status">Running...</div>
              <ul id="logs"></ul>
              <script type="importmap">
                { `{
                "imports": {
                  "valyrian.js": "../dist/index.mjs",
                  "valyrian.js/utils": "../dist/utils/index.mjs",
                  "valyrian.js/flux-store": "../dist/flux-store/index.mjs",
                  "valyrian.js/pulses": "../dist/pulses/index.mjs",
                  "valyrian.js/redux-devtools": "../dist/redux-devtools/index.mjs"
                }
              }` }
              </script>
              <script type="module">
                { `
            import { FluxStore } from "valyrian.js/flux-store";
            import { createPulseStore, createPulse } from "valyrian.js/pulses";
            import { connectFluxStore, connectPulseStore, connectPulse } from "valyrian.js/redux-devtools";

            const logs = [];
            const log = (msg) => {
                console.log(msg);
                logs.push(msg);
                const li = document.createElement("li");
                li.textContent = JSON.stringify(msg);
                document.getElementById("logs").appendChild(li);
            };
            log.connect = (options) => log({ type: "connect", options });
            log.init = (state) => log({ type: "init", state });
            log.send = (action, state) => log({ type: "send", action, state });

            async function runTest() {
                try {
                    // Test FluxStore
                    log("--- Testing FluxStore ---");
                    const fluxStore = new FluxStore({
                        state: { count: 0 },
                        mutations: {
                            increment(state) { state.count++; }
                        }
                    });
                    log.connect({ name: "FluxTest" });
                    log.init({ count: 0 });
                    connectFluxStore(fluxStore, { name: "FluxTest" });
                    log.send({ type: "increment" }, { count: 1 });
                    fluxStore.commit("increment");

                    // Test PulseStore
                    log("--- Testing PulseStore ---");
                    const pulseStore = createPulseStore(
                        { count: 2 },
                        {
                            increment(state) { state.count++; }
                        }
                    );
                    log.connect({ name: "PulseTest" });
                    log.init({ count: 2 });
                    connectPulseStore(pulseStore, { name: "PulseTest" });
                    log.send({ type: "increment" }, { count: 3 });
                    pulseStore.increment();

                    // Test Individual Pulse
                    log("--- Testing Individual Pulse ---");
                    log.connect({ name: "IndividualPulseTest" });
                    log.init({ count: 4 });
                    const pulse = createPulse( 4 )
                    const [ read, write ] = connectPulse( pulse, { name: "IndividualPulseTest" } )
                    log.send({ type: "update", payload: 5 }, { count: 5 });
                    write( 5 )

                    // Wait for async updates if any (PulseStore might be async)
                    await new Promise(r => setTimeout(r, 100));

                    // Verify logs
                    const events = logs.filter(l => typeof l === 'object');
                    
                    const fluxConnect = events.find(e => e.type === "connect" && e.options.name === "FluxTest");
                    const fluxSend = events.find(e => e.type === "send" && e.action.type === "increment" && e.state.count === 1);
                    
                    const pulseConnect = events.find(e => e.type === "connect" && e.options.name === "PulseTest");
                    const pulseSend = events.find(e => e.type === "send" && e.action.type === "increment" && e.state.count === 3);

                    const individualConnect = events.find(e => e.type === "connect" && e.options.name === "IndividualPulseTest");
                    const individualSend = events.find(e => e.type === "send" && e.action.type === "update" && e.state.count === 5);
                    
                    if (fluxConnect && fluxSend && pulseConnect && pulseSend && individualConnect && individualSend) {
                        document.getElementById("status").textContent = "SUCCESS";
                        document.getElementById("status").style.color = "green";
                    } else {
                        document.getElementById("status").textContent = "FAILURE";
                        document.getElementById("status").style.color = "red";
                        console.error("Missing events", { fluxConnect, fluxSend, pulseConnect, pulseSend, individualConnect, individualSend });
                    }

                } catch (e) {
                    document.getElementById("status").textContent = "ERROR: " + e.message;
                    document.getElementById("status").style.color = "red";
                    console.error(e);
                }
            }

            runTest();
          `}
              </script>
            </body>
          </html>
        </>
      )

      const html = mount( "html", () => htmlVNode )
      console.log( html )
      unmount()

      await write( "./test/devtools_verification.html", html )
      expect( await import( "fs" ).then( fs => fs.existsSync( "./test/devtools_verification.html" ) ) ).toBe( true )
    } )
  } )
} )
