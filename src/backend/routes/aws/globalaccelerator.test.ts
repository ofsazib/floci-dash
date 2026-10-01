import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockClient = vi.hoisted(() =>
  vi.fn(function () {
    return { send: mockSend };
  })
);

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-global-accelerator", () => ({
  GlobalAcceleratorClient: mockClient,
  ListAcceleratorsCommand: createCmd("ListAcceleratorsCommand"),
  CreateAcceleratorCommand: createCmd("CreateAcceleratorCommand"),
  DescribeAcceleratorCommand: createCmd("DescribeAcceleratorCommand"),
  UpdateAcceleratorCommand: createCmd("UpdateAcceleratorCommand"),
  DeleteAcceleratorCommand: createCmd("DeleteAcceleratorCommand"),
  ListListenersCommand: createCmd("ListListenersCommand"),
  CreateListenerCommand: createCmd("CreateListenerCommand"),
  DeleteListenerCommand: createCmd("DeleteListenerCommand"),
  ListEndpointGroupsCommand: createCmd("ListEndpointGroupsCommand"),
  CreateEndpointGroupCommand: createCmd("CreateEndpointGroupCommand"),
  UpdateEndpointGroupCommand: createCmd("UpdateEndpointGroupCommand"),
  DeleteEndpointGroupCommand: createCmd("DeleteEndpointGroupCommand"),
  AddEndpointsCommand: createCmd("AddEndpointsCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./globalaccelerator";

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

const ACC = {
  AcceleratorArn: "arn:aws:globalaccelerator::1:accelerator/abc",
  Name: "acc1",
  IpAddressType: "IPV4",
  Enabled: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("accelerators", () => {
  it("lists accelerators", async () => {
    mockSend.mockResolvedValueOnce({ Accelerators: [ACC] });
    const res = await get("/accelerators");
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.accelerators[0].Name).toBe("acc1");
  });

  it("returns sparse accelerators", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/accelerators");
    const json = await res.json();
    expect(json.accelerators).toEqual([]);
  });

  it("creates an accelerator", async () => {
    mockSend.mockResolvedValueOnce({ Accelerator: ACC });
    const res = await post("/accelerators", { name: "acc1", enabled: true });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.accelerator.Name).toBe("acc1");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateAcceleratorCommand",
        Name: "acc1",
        Enabled: true,
      })
    );
  });

  it("400 accelerator create without name", async () => {
    expect((await post("/accelerators", {})).status).toBe(400);
  });

  it("describes an accelerator", async () => {
    mockSend.mockResolvedValueOnce({ Accelerator: ACC });
    const res = await get("/accelerators/arn%3Ax");
    const json = await res.json();
    expect(json.accelerator.Name).toBe("acc1");
  });

  it("returns null accelerator when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get("/accelerators/none");
    const json = await res.json();
    expect(json.accelerator).toBeNull();
  });

  it("updates an accelerator", async () => {
    mockSend.mockResolvedValueOnce({ Accelerator: { ...ACC, Name: "renamed" } });
    const res = await put("/accelerators/arn%3Ax", { name: "renamed" });
    const json = await res.json();
    expect(json.accelerator.Name).toBe("renamed");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateAcceleratorCommand",
        Name: "renamed",
      })
    );
  });

  it("deletes an accelerator", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/accelerators/arn%3Ax");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteAcceleratorCommand",
        AcceleratorArn: "arn:x",
      })
    );
  });
});

describe("listeners", () => {
  it("lists listeners for an accelerator", async () => {
    mockSend.mockResolvedValueOnce({
      Listeners: [{ ListenerArn: "arn:l", PortRanges: [{ FromPort: 80 }] }],
    });
    const res = await get("/accelerators/listeners?acceleratorArn=arn%3Ax");
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ListListenersCommand",
        AcceleratorArn: "arn:x",
      })
    );
  });

  it("returns sparse listeners", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/accelerators/listeners?acceleratorArn=arn%3Ax");
    const json = await res.json();
    expect(json.listeners).toEqual([]);
  });

  it("400 listener list without acceleratorArn", async () => {
    expect((await get("/accelerators/listeners")).status).toBe(400);
  });

  it("creates a listener with a default protocol", async () => {
    mockSend.mockResolvedValueOnce({ Listener: { ListenerArn: "arn:l" } });
    const res = await post("/listeners", {
      acceleratorArn: "arn:x",
      portRanges: [{ FromPort: 80, ToPort: 80 }],
    });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateListenerCommand",
        Protocol: "TCP",
      })
    );
  });

  it("400 listener create without arn or portRanges", async () => {
    expect((await post("/listeners", { portRanges: [{ FromPort: 80 }] })).status).toBe(400);
    expect((await post("/listeners", { acceleratorArn: "arn:x" })).status).toBe(400);
  });

  it("deletes a listener", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/listeners/arn%3Al");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteListenerCommand",
        ListenerArn: "arn:l",
      })
    );
  });
});

describe("endpoint groups", () => {
  it("lists endpoint groups for a listener", async () => {
    mockSend.mockResolvedValueOnce({
      EndpointGroups: [{ EndpointGroupArn: "arn:g", EndpointGroupRegion: "us-east-1" }],
    });
    const res = await get("/listeners/endpoint-groups?listenerArn=arn%3Al");
    const json = await res.json();
    expect(json.total).toBe(1);
  });

  it("returns sparse endpoint groups", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/listeners/endpoint-groups?listenerArn=arn%3Al");
    const json = await res.json();
    expect(json.endpointGroups).toEqual([]);
  });

  it("400 endpoint-group list without listenerArn", async () => {
    expect((await get("/listeners/endpoint-groups")).status).toBe(400);
  });

  it("creates an endpoint group", async () => {
    mockSend.mockResolvedValueOnce({ EndpointGroup: { EndpointGroupArn: "arn:g" } });
    const res = await post("/endpoint-groups", {
      listenerArn: "arn:l",
      endpointGroupRegion: "us-east-1",
      trafficDialPercentage: 100,
    });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateEndpointGroupCommand",
        EndpointGroupRegion: "us-east-1",
        TrafficDialPercentage: 100,
      })
    );
  });

  it("400 endpoint-group create without listenerArn or region", async () => {
    expect((await post("/endpoint-groups", { endpointGroupRegion: "us-east-1" })).status).toBe(400);
    expect((await post("/endpoint-groups", { listenerArn: "arn:l" })).status).toBe(400);
  });

  it("updates an endpoint group", async () => {
    mockSend.mockResolvedValueOnce({ EndpointGroup: { EndpointGroupArn: "arn:g" } });
    const res = await put("/endpoint-groups/arn%3Ag", { trafficDialPercentage: 50 });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateEndpointGroupCommand",
        TrafficDialPercentage: 50,
      })
    );
  });

  it("deletes an endpoint group", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/endpoint-groups/arn%3Ag");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteEndpointGroupCommand",
        EndpointGroupArn: "arn:g",
      })
    );
  });

  it("adds endpoints to a group", async () => {
    mockSend.mockResolvedValueOnce({ EndpointDescriptions: [{ EndpointId: "i-1" }] });
    const res = await post("/endpoint-groups/arn%3Ag/endpoints", {
      endpointConfigurations: [{ EndpointId: "i-1" }],
    });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.endpointDescriptions[0].EndpointId).toBe("i-1");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "AddEndpointsCommand",
        EndpointGroupArn: "arn:g",
      })
    );
  });

  it("400 add endpoints without configurations", async () => {
    expect((await post("/endpoint-groups/arn%3Ag/endpoints", {})).status).toBe(400);
    expect(
      (await post("/endpoint-groups/arn%3Ag/endpoints", { endpointConfigurations: [] })).status
    ).toBe(400);
  });
});

describe("tags", () => {
  it("lists tags", async () => {
    mockSend.mockResolvedValueOnce({ Tags: [{ Key: "env", Value: "dev" }] });
    const res = await get("/resources/tags?arn=arn%3Ax");
    const json = await res.json();
    expect(json.tags).toEqual([{ Key: "env", Value: "dev" }]);
  });

  it("returns sparse tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/resources/tags?arn=arn%3Ax");
    const json = await res.json();
    expect(json.tags).toEqual([]);
  });

  it("400 tag list without arn", async () => {
    expect((await get("/resources/tags")).status).toBe(400);
  });

  it("adds tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/resources/tags", {
      resourceArn: "arn:x",
      tags: [{ Key: "env", Value: "dev" }],
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "TagResourceCommand",
        ResourceArn: "arn:x",
      })
    );
  });

  it("400 add tags without arn or empty tags", async () => {
    expect((await post("/resources/tags", { tags: [{ Key: "k", Value: "v" }] })).status).toBe(400);
    expect((await post("/resources/tags", { resourceArn: "arn:x" })).status).toBe(400);
    expect((await post("/resources/tags", { resourceArn: "arn:x", tags: [] })).status).toBe(400);
  });

  it("removes tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/resources/tags/untag", { resourceArn: "arn:x", tagKeys: ["env"] });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UntagResourceCommand",
        TagKeys: ["env"],
      })
    );
  });

  it("400 untag without arn or empty keys", async () => {
    expect((await post("/resources/tags/untag", { tagKeys: ["env"] })).status).toBe(400);
    expect((await post("/resources/tags/untag", { resourceArn: "arn:x" })).status).toBe(400);
    expect((await post("/resources/tags/untag", { resourceArn: "arn:x", tagKeys: [] })).status).toBe(400);
  });
});
